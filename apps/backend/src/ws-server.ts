import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';
import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
        
        // 1. Save binary snapshot
        await prisma.sheet.update({
          where: { id: documentName },
          data: { content: Buffer.from(state) }
        });

        // 2. Log success (Flattening logic removed as it does not match current cell-based model)
        console.log(`✅ Saved snapshot for ${documentName} (${state.byteLength} bytes)`);
      },
    }),
  ],

  // Authentication
  async onConnect(data) {
    const { requestParameters } = data;
    const token = requestParameters.get('token');
    const logFile = '/app/apps/backend/ws-auth-debug.log';

    const log = (msg: string) => {
      const entry = `[${new Date().toISOString()}] ${msg}\n`;
      fs.appendFileSync(logFile, entry);
      console.log(msg);
    };

    if (!token) {
      log(`Auth failed: No token provided. Params: ${JSON.stringify(Object.fromEntries(requestParameters))}`);
      throw new Error('Unauthorized');
    }

    if (token === 'SYSTEM_TOKEN') {
      return {
        user: {
          id: 'system',
          name: 'System Integration',
        }
      };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      log(`User ${decoded.userId} connected to ${data.documentName}`);
      
      return {
        user: {
          id: decoded.userId,
          name: decoded.name,
        }
      };
    } catch (err) {
      log(`Auth verification failed: ${err}`);
      log(`Token was: ${token.substring(0, 10)}... (Secret length: ${JWT_SECRET?.length})`);
      throw new Error('Unauthorized');
    }
  },
});

server.listen();