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

        try {
          const [rowsResult, columnsResult] = await Promise.all([
            SheetRowEntity.query.bySheet({ sheetId }).go(),
            SheetColumnEntity.query.primary({ sheetId }).go(),
          ]);

          const yRows = document.getMap('rows');
          const yOrder = document.getArray('order');
          const yColumns = document.getArray('columns');

          if (yColumns.length === 0) {
            // Fresh document — full hydration of columns and rows
            const sortedCols = columnsResult.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            document.transact(() => {
              for (const col of sortedCols) {
                yColumns.push([{
                  id: col.columnId,
                  label: col.name,
                  type: col.type ?? 'TEXT',
                  width: col.width ?? 150,
                  config: col.config ?? {},
                }]);
              }

              for (const row of rowsResult.data) {
                const rowData = (row.data ?? {}) as Record<string, unknown>;
                // Store plain objects (not Y.Map) — SheetProvider reads rows as plain objects
                yRows.set(row.rowId, { id: row.rowId, ...rowData });
                yOrder.push([row.rowId]);
                // Populate row file attachments from _files_ key (written by form submission)
                if (Array.isArray(rowData._files_) && rowData._files_.length > 0) {
                  const yFiles = document.getArray(`row-${row.rowId}-files`);
                  if (yFiles.length === 0) {
                    yFiles.push(rowData._files_ as unknown[]);
                  }
                }
              }
            });
          } else {
            // Document already has columns — merge in any new columns from DynamoDB
            // (e.g. columns added via the UI or form field mappings after initial hydration)
            // and any rows written directly to DynamoDB (e.g. form submissions).
            const existingColIds = new Set(
              (yColumns.toArray() as Array<{ id: string }>).map(c => c.id)
            );
            const newCols = columnsResult.data.filter(col => !existingColIds.has(col.columnId));
            const missingRows = rowsResult.data.filter(row => !yRows.has(row.rowId));

            if (newCols.length > 0 || missingRows.length > 0) {
              document.transact(() => {
                for (const col of newCols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
                  yColumns.push([{
                    id: col.columnId,
                    label: col.name,
                    type: col.type ?? 'TEXT',
                    width: col.width ?? 150,
                    config: col.config ?? {},
                  }]);
                }
                for (const row of missingRows) {
                  const rowData = (row.data ?? {}) as Record<string, unknown>;
                  yRows.set(row.rowId, { id: row.rowId, ...rowData });
                  yOrder.push([row.rowId]);
                  if (Array.isArray(rowData._files_) && rowData._files_.length > 0) {
                    const yFiles = document.getArray(`row-${row.rowId}-files`);
                    if (yFiles.length === 0) {
                      yFiles.push(rowData._files_ as unknown[]);
                    }
                  }
                }
              });
            }
          }
        } catch (err) {
          console.error(`[ws] Failed to hydrate document ${sheetId}:`, err);
        }

        // Return null -- we already mutated the doc in place
        return null;
      },

      /**
       * Persist Yjs document state back to DynamoDB (rows + columns).
       * Debounced to avoid excessive writes during rapid editing.
       */
      store: async ({ documentName, document }) => {
        const { projectId, sheetId } = parseDocumentName(documentName);

        // Clear any pending debounce for this document
        const existing = pendingWrites.get(documentName);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(async () => {
          const yRows = document.getMap('rows');
          const yColumns = document.getArray('columns');
          const now = new Date().toISOString();

          // ── Persist columns ──────────────────────────────────────────
          const cols = yColumns.toArray() as Array<{
            id: string;
            label?: string;
            type?: string;
            width?: number;
            config?: Record<string, unknown>;
          }>;

          for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            if (!col?.id) continue;
            try {
              await SheetColumnEntity.patch({ sheetId, columnId: col.id })
                .set({
                  name: col.label ?? col.id,
                  type: col.type ?? 'TEXT',
                  width: col.width ?? 150,
                  order: i,
                  config: col.config ?? {},
                  updatedAt: now,
                })
                .go();
            } catch {
              // Column may not exist yet — create it
              try {
                await SheetColumnEntity.create({
                  columnId: col.id,
                  sheetId,
                  projectId: projectId ?? '',
                  name: col.label ?? col.id,
                  type: col.type ?? 'TEXT',
                  width: col.width ?? 150,
                  order: i,
                  config: col.config ?? {},
                  createdAt: now,
                  updatedAt: now,
                }).go();
              } catch (createErr) {
                console.error(`[ws] Failed to create column ${col.id}:`, createErr);
              }
            }
          }

          // ── Persist rows ─────────────────────────────────────────────
          for (const [rowId, yRow] of yRows.entries()) {
            const data: Record<string, unknown> = {};
            if (yRow instanceof Y.Map) {
              yRow.forEach((v: unknown, k: string) => {
                if (k !== 'id') data[k] = v;
              });
            } else if (yRow && typeof yRow === 'object') {
              // Plain object (written by SheetProvider or hydrated from DynamoDB)
              for (const [k, v] of Object.entries(yRow as Record<string, unknown>)) {
                if (k !== 'id') data[k] = v;
              }
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
          // Remove from map only after the write loop completes so concurrent
          // incoming changes set a fresh timer rather than racing with this write.
          pendingWrites.delete(documentName);
        }, WRITE_DEBOUNCE_MS);

        pendingWrites.set(documentName, timer);
      },
    }),
  ],

  // Authentication via Hocuspocus auth message
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      const userId = (decoded.sub ?? decoded.userId) as string;
      const userName = (decoded.name ?? decoded.email ?? 'Unknown') as string;

      // Verify the token was issued for this specific sheet to prevent token reuse across sheets.
      // Tokens MUST carry a sheetId claim; absence is treated as rejection, not leniency.
      const { sheetId: docSheetId } = parseDocumentName(documentName);
      const tokenSheetId = decoded.sheetId as string | undefined;
      if (!tokenSheetId || tokenSheetId !== docSheetId) {
        throw new Error('Unauthorized: token not valid for this document');
      }

      return {
        user: { id: userId, name: userName },
      };
    } catch (err) {
      // Log at warn level — JWT error reasons (expired, bad sig) are operational
      // info, not application errors, and should not appear in error alert channels.
      console.warn('[ws] Authentication rejected:', err instanceof Error ? err.message : err);
      throw new Error('Unauthorized');
    }
  },
});

const WS_PORT = Number(process.env.WS_PORT) || 1234;

server
  .listen()
  .then(() => {
    process.stdout.write(`WebSocket server listening on port ${WS_PORT}\n`);
  })
  .catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`WebSocket port ${WS_PORT} is already in use. Exiting.`);
    } else {
      console.error('WebSocket server failed to start:', err);
    }
    process.exit(1);
  });
