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

  // Authentication
  async onConnect(data) {
    const { requestParameters } = data;
    const token = requestParameters.get('token');

    if (!token) {
      console.log(`Auth failed: No token provided.`);
      throw new Error('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log(`User ${decoded.sub} connected to ${data.documentName}`);

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

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ WebSocket port ${WS_PORT} is already in use. Exiting.`);
    process.exit(1);
  } else {
    console.error('WebSocket server error:', err);
    throw err;
  }
});

server.listen();
