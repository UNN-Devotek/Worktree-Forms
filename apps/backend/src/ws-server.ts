import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import { SheetEntity } from './lib/dynamo/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

// The ws-server needs to know the projectId for a given sheetId.
// For the Hocuspocus persistence layer, we look up sheets by scanning.
// In practice, documentName should encode projectId (e.g., "projectId:sheetId").

const server = new Server({
  port: Number(process.env.WS_PORT) || 1234,

  extensions: [
    new Logger(),
    new Database({
      // Persistence Layer
      fetch: async ({ documentName }) => {
        console.log(`Fetching document: ${documentName}`);
        // documentName is the sheetId; we scan for it
        const result = await SheetEntity.scan
          .where((attr, op) => op.eq(attr.sheetId, documentName))
          .go();
        const sheet = result.data[0];
        // Note: Sheet content (Yjs binary) is not stored in DynamoDB in
        // the ElectroDB entity (no 'content' attribute). In production,
        // Yjs state should be stored in S3 or a separate DynamoDB item.
        // For now, return null to start fresh.
        return null;
      },
      store: async ({ documentName, state }) => {
        console.log(`Storing document: ${documentName} (${state.byteLength} bytes)`);
        // In production, persist state to S3 or a dedicated DynamoDB item.
        // The ElectroDB SheetEntity does not have a 'content' field for binary data.
        console.log(`Snapshot for ${documentName} received but binary storage not yet implemented`);
      },
    }),
  ],

  // Authentication via Hocuspocus auth message
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      console.log(`Auth failed: No token provided for ${documentName}`);
      throw new Error('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      console.log(`User ${decoded.sub} authenticated for ${documentName}`);

      return {
        user: {
          id: decoded.sub as string,
          name: (decoded.name ?? decoded.email) as string,
        },
      };
    } catch (err) {
      console.log(`Auth verification failed: ${err}`);
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
