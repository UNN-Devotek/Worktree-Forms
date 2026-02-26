import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

const server = new Server({
  port: Number(process.env.WS_PORT) || 1234,

  extensions: [
    new Logger(),
    new Database({
      // Persistence Layer
      fetch: async ({ documentName }) => {
        console.log(`Fetching document: ${documentName}`);
        const sheet = await prisma.sheet.findUnique({
          where: { id: documentName },
          select: { content: true }
        });
        return sheet?.content ? new Uint8Array(sheet.content) : null;
      },
      store: async ({ documentName, state }) => {
        console.log(`Storing document: ${documentName}`);

        // Save binary snapshot
        await prisma.sheet.update({
          where: { id: documentName },
          data: { content: Buffer.from(state) }
        });

        console.log(`✅ Saved snapshot for ${documentName} (${state.byteLength} bytes)`);
      },
    }),
  ],

  // Authentication via Hocuspocus auth message (sent by the client's `token`
  // option). Token is never embedded in the URL, keeping it out of proxy logs.
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      console.log(`Auth failed: No token provided for ${documentName}`);
      throw new Error('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log(`User ${decoded.sub} authenticated for ${documentName}`);

      return {
        user: {
          id: decoded.sub,
          name: decoded.name ?? decoded.email,
        }
      };
    } catch (err) {
      console.log(`Auth verification failed: ${err}`);
      throw new Error('Unauthorized');
    }
  },
});

const WS_PORT = Number(process.env.WS_PORT) || 1234;

console.log(`🚀 Starting Hocuspocus WebSocket server on port ${WS_PORT}...`);

server.listen().then(() => {
  console.log(`✅ WebSocket server listening on port ${WS_PORT}`);
}).catch((err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ WebSocket port ${WS_PORT} is already in use. Exiting.`);
  } else {
    console.error('❌ WebSocket server failed to start:', err);
  }
  process.exit(1);
});
