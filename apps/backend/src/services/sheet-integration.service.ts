import { SheetEntity, SheetRowEntity, RouteStopEntity } from '../lib/dynamo/index.js';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import ws from 'ws';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

// Polyfill the global WebSocket with the `ws` package so HocuspocusProvider
// can open its own internal connection in Node.js.
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as Record<string, unknown>).WebSocket = ws;
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
  async appendSubmissionToSheet(sheetId: string, projectId: string, submissionData: unknown) {

    try {
      // 1. Verify sheet exists
      const sheetResult = await SheetEntity.get({ projectId, sheetId }).go();
      if (!sheetResult.data) return;

      // 2. Create the row in DynamoDB
      const rowId = nanoid();
      const newRow = await SheetRowEntity.create({
        rowId,
        sheetId,
        projectId,
        data: submissionData,
        order: 0,
      }).go();

      // 3. Inject into Yjs document so active users see it instantly
      await this.injectRowIntoYjs(sheetId, { id: newRow.data.rowId, data: newRow.data.data });
    } catch (error) {
      console.error('Sheet integration failed:', error);
    }
  }

  /**
   * Updates a linked SheetRow when a RouteStop changes.
   */
  async syncRouteStopToSheet(routeId: string, stopId: string, updates: Record<string, unknown>) {
    try {
      const stopResult = await RouteStopEntity.get({ routeId, stopId }).go();
      const stop = stopResult.data;
      if (!stop) return;

      // In DynamoDB, we'd need the sheetRowId stored on the stop or a lookup
      // For now, this is a no-op until the data model links stops to rows
      // Stop-to-row linking not yet implemented in DynamoDB model
    } catch (error) {
      console.error('Sync Stop to Sheet failed:', error);
    }
  }

  /**
   * Updates linked RouteStops when a SheetRow changes.
   */
  async syncSheetToRoute(_rowId: string, _rowData: unknown) {
    // In DynamoDB, reverse lookups from row -> route stops require a GSI or scan.
    // For now, this is a no-op placeholder.
    // Row-to-stop reverse sync not yet implemented in DynamoDB model
  }

  /**
   * Syncs columns from a form schema into the Yjs document for a sheet.
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

      const outerTimer = setTimeout(() => {
        settle(() => reject(new Error(`syncColumnsToYjs timed out after ${SYNC_TIMEOUT_MS}ms for sheet ${sheetId}`)));
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
            settle(() => reject(new Error('Column sync failed: connection dropped before sync completed')));
            cleanup();
            return;
          }

          clearTimeout(outerTimer);
          const yColumns = doc.getArray('columns');

          doc.transact(() => {
            if (yColumns.length > 0) yColumns.delete(0, yColumns.length);
            for (const col of columns) {
              yColumns.push([
                {
                  id: col.id,
                  label: col.label,
                  type: col.type.toUpperCase(),
                  width: 150,
                },
              ]);
            }
          });

          setTimeout(() => {
            settle(() => resolve(true));
            cleanup();
          }, 1000);
        },
        onDisconnect: (data: Record<string, unknown>) => {
          const code = (data?.event as Record<string, unknown>)?.code;
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
   */
  static createInitialYjsDoc(columns: Array<{ id: string; label: string; type: string }>): Buffer {
    const doc = new Y.Doc();
    const yColumns = doc.getArray('columns');

    doc.transact(() => {
      for (const col of columns) {
        yColumns.push([
          {
            id: col.id,
            label: col.label,
            type: col.type.toUpperCase(),
            width: 150,
          },
        ]);
      }
    });

    return Buffer.from(Y.encodeStateAsUpdate(doc));
  }

  private async injectRowIntoYjs(sheetId: string, row: { id: string; data: unknown }) {
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
        settle(() =>
          reject(new Error(`injectRowIntoYjs timed out after ${SYNC_TIMEOUT_MS}ms for sheet ${sheetId}`)),
        );
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
          const yRows = doc.getMap('rows');
          const yOrder = doc.getArray('order');

          doc.transact(() => {
            yRows.set(row.id, { ...(row.data as object), id: row.id, parentId: null });
            yOrder.push([row.id]);
          });

          setTimeout(() => {
            settle(() => resolve(true));
            cleanup();
          }, 1000);
        },
        onDisconnect: (data: Record<string, unknown>) => {
          const code = (data?.event as Record<string, unknown>)?.code;
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
