import { prisma } from '../db.js';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import ws from 'ws';
import jwt from 'jsonwebtoken';

// Polyfill the global WebSocket with the `ws` package so HocuspocusProvider
// can open its own internal connection in Node.js. This removes the need for
// an external HocuspocusProviderWebsocket instance and the undocumented
// provider.attach() call that was previously required to make onSynced fire.
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

const WS_URL = process.env.WS_INTERNAL_URL || 'ws://worktree-ws:1234';
const SYNC_TIMEOUT_MS = 15_000;

function makeSystemToken(): string {
  return jwt.sign(
    { sub: 'system', email: 'system@worktree.internal', systemRole: 'ADMIN' },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256', expiresIn: '5m' },
  );
}

export class SheetIntegrationService {
  /**
   * Appends a submission data as a new row to a target sheet.
   */
  async appendSubmissionToSheet(sheetId: string, submissionData: any) {
    console.log(`Integrating submission to sheet ${sheetId}`);

    try {
      // 1. Verify sheet exists — columns are already defined by the form schema
      // (created when the form was saved). Never auto-create columns from submission
      // data keys, which would add polluting metadata columns.
      const sheet = await prisma.sheet.findUnique({
        where: { id: sheetId },
        select: { id: true }
      });

      if (!sheet) return;

      // 2. Create the row in SQL (for persistence and snapshots)
      const newRow = await prisma.sheetRow.create({
        data: {
          sheetId,
          data: submissionData,
          rank: 'a0', // Simplistic rank for now
        }
      });

      // 3. Inject into Yjs document so active users see it instantly
      await this.injectRowIntoYjs(sheetId, newRow);

    } catch (error) {
      console.error('Sheet integration failed:', error);
    }
  }

  /**
   * Updates a linked SheetRow when a RouteStop changes.
   */
  async syncRouteStopToSheet(stopId: number, updates: any) {
    try {
      const stop = await prisma.routeStop.findUnique({
        where: { id: stopId },
        include: { sheetRow: true }
      });

      if (!stop?.sheetRowId) return;

      const currentRowData = stop.sheetRow?.data as any || {};
      const newData = { ...currentRowData, ...updates };

      await prisma.sheetRow.update({
        where: { id: stop.sheetRowId },
        data: { data: newData }
      });

      await this.injectRowIntoYjs(stop.sheetRow!.sheetId, { id: stop.sheetRowId, data: newData });
    } catch (error) {
      console.error('Sync Stop to Sheet failed:', error);
    }
  }

  /**
   * Updates linked RouteStops when a SheetRow changes.
   */
  async syncSheetToRoute(rowId: string, rowData: any) {
    try {
      const row = await prisma.sheetRow.findUnique({
        where: { id: rowId },
        include: { routeStops: true }
      });

      if (!row || row.routeStops.length === 0) return;

      for (const stop of row.routeStops) {
        const updates: any = {};
        if (rowData.address) updates.address = rowData.address;
        if (rowData.status) updates.status = rowData.status.toLowerCase();
        if (rowData.title) updates.title = rowData.title;

        if (Object.keys(updates).length > 0) {
          await prisma.routeStop.update({
            where: { id: stop.id },
            data: updates
          });
        }
      }
    } catch (error) {
      console.error('Sync Sheet to Route failed:', error);
    }
  }

  /**
   * Syncs columns from a form schema into the Yjs document for a sheet.
   * Clears existing columns and replaces them with the new set.
   */
  async syncColumnsToYjs(sheetId: string, columns: Array<{ id: string; label: string; type: string }>) {
    return new Promise<boolean>((resolve, reject) => {
      let settled = false;
      const doc = new Y.Doc();
      let provider: HocuspocusProvider | undefined;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const cleanup = () => {
        provider?.destroy();
        doc.destroy();
      };

      // Guard against the WS server being unavailable or onSynced never firing.
      const outerTimer = setTimeout(() => {
        settle(() => reject(new Error(`syncColumnsToYjs timed out after ${SYNC_TIMEOUT_MS}ms for sheet ${sheetId}`)));
        cleanup();
      }, SYNC_TIMEOUT_MS);

      provider = new HocuspocusProvider({
        url: WS_URL,
        name: sheetId,
        document: doc,
        // Token sent as a Hocuspocus auth message — not embedded in the URL —
        // so it does not appear in proxy access logs.
        token: makeSystemToken(),
        onSynced: ({ state }: { state: boolean }) => {
          if (!state) {
            // Connection dropped before sync completed.
            clearTimeout(outerTimer);
            settle(() => reject(new Error('Column sync failed: connection dropped before sync completed')));
            cleanup();
            return;
          }

          clearTimeout(outerTimer);
          console.log(`Backend Yjs: syncing ${columns.length} columns to sheet ${sheetId}`);
          const yColumns = doc.getArray('columns');

          doc.transact(() => {
            if (yColumns.length > 0) yColumns.delete(0, yColumns.length);
            for (const col of columns) {
              yColumns.push([{
                id: col.id,
                label: col.label,
                type: col.type.toUpperCase(),
                width: 150,
              }]);
            }
          });

          // Allow ~1 s for Hocuspocus to broadcast the update to connected
          // clients before closing this temporary provider.
          setTimeout(() => {
            settle(() => resolve(true));
            cleanup();
          }, 1000);
        },
        onDisconnect: (data: any) => {
          const code = data?.event?.code;
          if (code && code !== 1000) {
            clearTimeout(outerTimer);
            settle(() => reject(new Error(`Column sync WebSocket closed with error code ${code}`)));
            cleanup();
          }
        },
      });
    });
  }

  /**
   * Creates an initial Yjs document binary with columns pre-populated.
   * Use this when creating a new sheet (no active connections yet).
   * Returns a Buffer to save as Sheet.content.
   */
  static createInitialYjsDoc(columns: Array<{ id: string; label: string; type: string }>): Buffer {
    const doc = new Y.Doc();
    const yColumns = doc.getArray('columns');

    doc.transact(() => {
      for (const col of columns) {
        yColumns.push([{
          id: col.id,
          label: col.label,
          type: col.type.toUpperCase(),
          width: 150,
        }]);
      }
    });

    return Buffer.from(Y.encodeStateAsUpdate(doc));
  }

  private async injectRowIntoYjs(sheetId: string, row: { id: string; data: any }) {
    return new Promise<boolean>((resolve, reject) => {
      let settled = false;
      const doc = new Y.Doc();
      let provider: HocuspocusProvider | undefined;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const cleanup = () => {
        provider?.destroy();
        doc.destroy();
      };

      const outerTimer = setTimeout(() => {
        settle(() => reject(new Error(`injectRowIntoYjs timed out after ${SYNC_TIMEOUT_MS}ms for sheet ${sheetId}`)));
        cleanup();
      }, SYNC_TIMEOUT_MS);

      provider = new HocuspocusProvider({
        url: WS_URL,
        name: sheetId,
        document: doc,
        token: makeSystemToken(),
        onSynced: ({ state }: { state: boolean }) => {
          if (!state) {
            clearTimeout(outerTimer);
            settle(() => reject(new Error('Row injection failed: connection dropped before sync completed')));
            cleanup();
            return;
          }

          clearTimeout(outerTimer);
          console.log(`Backend Yjs: injecting row ${row.id} into sheet ${sheetId}`);
          const yRows = doc.getMap('rows');
          const yOrder = doc.getArray('order');

          doc.transact(() => {
            yRows.set(row.id, { ...row.data, id: row.id, parentId: null });
            yOrder.push([row.id]);
          });

          setTimeout(() => {
            settle(() => resolve(true));
            cleanup();
          }, 1000);
        },
        onDisconnect: (data: any) => {
          const code = data?.event?.code;
          if (code && code !== 1000) {
            clearTimeout(outerTimer);
            settle(() => reject(new Error(`Row injection WebSocket closed with error code ${code}`)));
            cleanup();
          }
        },
      });
    });
  }
}
