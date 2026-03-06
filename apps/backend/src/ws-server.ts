import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import { SheetRowEntity, SheetColumnEntity } from './lib/dynamo/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

// ---------------------------------------------------------------------------
// Document name convention: "<sheetId>" (legacy) or "sheet:<projectId>:<sheetId>"
// ---------------------------------------------------------------------------

function parseDocumentName(documentName: string): { projectId: string | null; sheetId: string } {
  if (documentName.startsWith('sheet:')) {
    const parts = documentName.split(':');
    return { projectId: parts[1] ?? null, sheetId: parts[2] ?? documentName };
  }
  // Legacy: documentName is the raw sheetId
  return { projectId: null, sheetId: documentName };
}

// Debounce map: one pending write per document
const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();
const WRITE_DEBOUNCE_MS = 2000;

const server = new Server({
  port: Number(process.env.WS_PORT) || 1234,

  extensions: [
    new Logger(),
    new Database({
      /**
       * Hydrate the Yjs document from DynamoDB rows and columns.
       */
      fetch: async ({ documentName, document }) => {
        const { sheetId } = parseDocumentName(documentName);
        console.log(`[ws] Fetching document data for sheet: ${sheetId}`);

        try {
          const [rowsResult, columnsResult] = await Promise.all([
            SheetRowEntity.query.bySheet({ sheetId }).go(),
            SheetColumnEntity.query.primary({ sheetId }).go(),
          ]);

          const yRows = document.getMap('rows');
          const yOrder = document.getArray('order');
          const yColumns = document.getArray('columns');

          // Only hydrate if the document is empty (first load)
          if (yRows.size === 0 && yColumns.length === 0) {
            const sortedCols = columnsResult.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            document.transact(() => {
              // Hydrate columns (sorted by order)
              for (const col of sortedCols) {
                yColumns.push([{
                  id: col.columnId,
                  label: col.name,
                  type: col.type ?? 'TEXT',
                  width: col.width ?? 150,
                  config: col.config ?? {},
                }]);
              }

              // Hydrate rows
              for (const row of rowsResult.data) {
                const rowData = (row.data ?? {}) as Record<string, unknown>;
                const yRow = new Y.Map();
                yRow.set('id', row.rowId);
                Object.entries(rowData).forEach(([k, v]) => {
                  yRow.set(k, v);
                });
                yRows.set(row.rowId, yRow);
                yOrder.push([row.rowId]);
              }
            });

            console.log(`[ws] Hydrated ${rowsResult.data.length} rows, ${sortedCols.length} columns`);
          } else {
            console.log(`[ws] Document ${sheetId} already has state, skipping hydration`);
          }
        } catch (err) {
          console.error(`[ws] Failed to hydrate document ${sheetId}:`, err);
        }

        // Return null -- we already mutated the doc in place
        return null;
      },

      /**
       * Persist Yjs document state back to DynamoDB rows.
       * Debounced to avoid excessive writes during rapid editing.
       */
      store: async ({ documentName, document }) => {
        const { projectId, sheetId } = parseDocumentName(documentName);

        // Clear any pending debounce for this document
        const existing = pendingWrites.get(documentName);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(async () => {
          pendingWrites.delete(documentName);

          const yRows = document.getMap('rows');
          const now = new Date().toISOString();

          console.log(`[ws] Persisting ${yRows.size} rows for sheet: ${sheetId}`);

          for (const [rowId, yRow] of yRows.entries()) {
            const data: Record<string, unknown> = {};
            if (yRow instanceof Y.Map) {
              yRow.forEach((v: unknown, k: string) => {
                if (k !== 'id') data[k] = v;
              });
            }

            try {
              await SheetRowEntity.patch({ sheetId, rowId })
                .set({ data, updatedAt: now })
                .go();
            } catch {
              // Row may not exist yet in DynamoDB -- create it
              try {
                await SheetRowEntity.create({
                  rowId,
                  sheetId,
                  projectId: projectId ?? '',
                  data,
                  createdAt: now,
                  updatedAt: now,
                }).go();
              } catch (createErr) {
                console.error(`[ws] Failed to create row ${rowId}:`, createErr);
              }
            }
          }
        }, WRITE_DEBOUNCE_MS);

        pendingWrites.set(documentName, timer);
      },
    }),
  ],

  // Authentication via Hocuspocus auth message
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      console.log(`[ws] Auth failed: No token provided for ${documentName}`);
      throw new Error('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      const userId = (decoded.sub ?? decoded.userId) as string;
      const userName = (decoded.name ?? decoded.email ?? 'Unknown') as string;
      console.log(`[ws] User ${userId} authenticated for ${documentName}`);

      return {
        user: { id: userId, name: userName },
      };
    } catch {
      console.log(`[ws] Auth verification failed for ${documentName}`);
      throw new Error('Unauthorized');
    }
  },
});

const WS_PORT = Number(process.env.WS_PORT) || 1234;

console.log(`Starting Hocuspocus WebSocket server on port ${WS_PORT}...`);

server
  .listen()
  .then(() => {
    console.log(`WebSocket server listening on port ${WS_PORT}`);
  })
  .catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`WebSocket port ${WS_PORT} is already in use. Exiting.`);
    } else {
      console.error('WebSocket server failed to start:', err);
    }
    process.exit(1);
  });
