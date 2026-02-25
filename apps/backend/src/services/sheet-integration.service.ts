import { prisma } from '../db.js';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import ws from 'ws';
import jwt from 'jsonwebtoken';

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
      // We use a temporary Yjs client to push the update
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
    return new Promise((resolve, reject) => {
      const doc = new Y.Doc();
      const provider = new HocuspocusProvider({
        url: process.env.WS_INTERNAL_URL || 'ws://worktree-ws:1234',
        name: sheetId,
        document: doc,
        WebSocketPolyfill: ws,
        parameters: {
          token: jwt.sign(
            { sub: 'system', email: 'system@worktree.internal', systemRole: 'ADMIN' },
            process.env.JWT_SECRET!,
            { algorithm: 'HS256', expiresIn: '5m' },
          ),
        },
        onConnect: () => {
          console.log(`Backend Yjs: syncing ${columns.length} columns to sheet ${sheetId}`);
          const yColumns = doc.getArray('columns');

          doc.transact(() => {
            // Clear existing columns
            if (yColumns.length > 0) {
              yColumns.delete(0, yColumns.length);
            }
            // Push new columns
            for (const col of columns) {
              yColumns.push([{
                id: col.id,
                label: col.label,
                type: col.type.toUpperCase(),
                width: 150,
              }]);
            }
          });

          setTimeout(() => {
            provider.destroy();
            resolve(true);
          }, 500);
        },
        onConnectError: (err: any) => {
          console.error('Backend Yjs column sync error:', err);
          reject(err);
        }
      } as any);
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

  private async injectRowIntoYjs(sheetId: string, row: any) {
    // In a real production app, we'd use a more robust way to communicate with the WS server
    // (e.g. Redis Pub/Sub or a dedicated backend client).
    // For MVP, we'll try a direct Yjs + Hocuspocus provider connection from backend.
    
    return new Promise((resolve, reject) => {
      const doc = new Y.Doc();
      const provider = new HocuspocusProvider({
        url: process.env.WS_INTERNAL_URL || 'ws://worktree-ws:1234',
        name: sheetId,
        document: doc,
        WebSocketPolyfill: ws,
        parameters: {
          token: jwt.sign(
            { sub: 'system', email: 'system@worktree.internal', systemRole: 'ADMIN' },
            process.env.JWT_SECRET!,
            { algorithm: 'HS256', expiresIn: '5m' },
          ),
        },
        onConnect: () => {
          console.log('Backend Yjs client connected');
          const yRows = doc.getMap('rows');
          const yOrder = doc.getArray('order');
          
          doc.transact(() => {
            yRows.set(row.id, { ...row.data, id: row.id, parentId: null });
            yOrder.push([row.id]);
          });
          
          // Wait for sync and disconnect
          setTimeout(() => {
            provider.destroy();
            resolve(true);
          }, 500);
        },
        onConnectError: (err: any) => {
          console.error('Backend Yjs sync error:', err);
          reject(err);
        }
      } as any);
    });
  }
}
