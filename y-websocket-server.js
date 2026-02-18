#!/usr/bin/env node

/**
 * Y-WebSocket Server with LevelDB Persistence
 * 
 * This server provides real-time collaboration via WebSockets
 * with persistent storage using LevelDB.
 * 
 * Security:
 *   - Connections must pass a valid JWT in the URL query string (?token=xxx)
 *   - Document names are sanitized to prevent traversal attacks
 */

const { WebSocketServer } = require('ws');
const http = require('http');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const debounce = require('lodash.debounce');
const { LeveldbPersistence } = require('y-leveldb');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 1234;
const PERSIST_DIR = process.env.PERSIST_DIR || './yjs-leveldb';
const JWT_SECRET = process.env.JWT_SECRET || '';

const persistence = new LeveldbPersistence(PERSIST_DIR);

// ─── Authentication ────────────────────────────────────────────────────────────

/**
 * Finding #1 (R4): Validate JWT token from WebSocket URL query string.
 * Returns the decoded payload or null if invalid.
 * 
 * Uses a lightweight HMAC-SHA256 check without a full JWT library.
 * For production, consider using `jsonwebtoken` npm package.
 */
const crypto = require('crypto');

function verifyToken(token) {
  if (!token || !JWT_SECRET) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (expectedSig !== signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return null;
  }
}

// ─── Document Name Sanitization ────────────────────────────────────────────────

/**
 * Finding #2 (R4): Sanitize document names to prevent path traversal
 * and key pollution. Only allow alphanumeric, hyphens, and underscores.
 */
function sanitizeDocName(rawName) {
  if (!rawName) return null;
  // Strip anything that isn't alphanumeric, hyphen, underscore, or dot
  const clean = rawName.replace(/[^a-zA-Z0-9\-_\.]/g, '');
  // Reject empty or suspiciously short results
  if (!clean || clean.length < 1) return null;
  // Reject names that start with dots (hidden files)
  if (clean.startsWith('.')) return null;
  return clean;
}

// ─── Document & Awareness Management ───────────────────────────────────────────

// Store active documents and their shared Awareness instances
const docs = new Map();
const awarenessMap = new Map(); // Finding #14: one Awareness per document

const getYDoc = async (docname) => {
  if (docs.has(docname)) {
    return docs.get(docname);
  }

  const doc = new Y.Doc();
  docs.set(docname, doc);

  // Finding #14 (R4): Create ONE awareness per document, shared by all connections
  const awareness = new awarenessProtocol.Awareness(doc);
  awarenessMap.set(docname, awareness);

  // Load persisted data
  const persistedData = await persistence.getYDoc(docname);
  if (persistedData) {
    Y.applyUpdate(doc, persistedData);
  }

  // Save updates with debounce
  const saveUpdate = debounce(async () => {
    const update = Y.encodeStateAsUpdate(doc);
    await persistence.storeUpdate(docname, update);
    console.log(`[Persist] Saved document: ${docname}`);
  }, 1000);

  doc.on('update', saveUpdate);

  console.log(`[Doc] Created/Loaded: ${docname}`);
  return doc;
};

const getAwareness = (docname) => {
  return awarenessMap.get(docname);
};

// ─── Message types ─────────────────────────────────────────────────────────────

const messageSync = 0;
const messageAwareness = 1;

const messageHandler = async (conn, message) => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, conn.doc, conn);
        break;
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(
          conn.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
    }

    const response = encoding.toUint8Array(encoder);
    if (response.length > 1) {
      conn.send(response);
    }
  } catch (err) {
    console.error('[Error] Message handler:', err);
  }
};

// Broadcast awareness updates to all connections for the same document
const broadcastAwareness = (awareness, changedClients, docname) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageAwareness);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
  );
  const message = encoding.toUint8Array(encoder);

  const doc = docs.get(docname);
  if (doc && doc.conns) {
    doc.conns.forEach((conn) => {
      if (conn.readyState === conn.OPEN) {
        conn.send(message);
      }
    });
  }
};

// ─── HTTP & WebSocket Server ───────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Y-WebSocket Server with LevelDB Persistence\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', async (ws, req) => {
  // Parse URL for docname and token
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rawDocname = url.pathname.slice(1);
  const token = url.searchParams.get('token');

  // Finding #2 (R4): Sanitize document name
  const docname = sanitizeDocName(rawDocname);
  if (!docname) {
    console.warn(`[Auth] Rejected connection: invalid document name "${rawDocname}"`);
    ws.close(4001, 'Invalid document name');
    return;
  }

  // Finding #1 (R4): Authenticate the connection
  // Skip auth only if JWT_SECRET is not configured (dev mode)
  if (JWT_SECRET) {
    const payload = verifyToken(token);
    if (!payload) {
      console.warn(`[Auth] Rejected connection to ${docname}: invalid or expired token`);
      ws.close(4003, 'Unauthorized');
      return;
    }
    console.log(`[Connection] Authenticated user ${payload.sub || payload.userId || 'unknown'} to: ${docname}`);
  } else {
    console.log(`[Connection] Client connected to: ${docname} (auth disabled — no JWT_SECRET)`);
  }

  const doc = await getYDoc(docname);
  const awareness = getAwareness(docname);

  ws.doc = doc;
  ws.awareness = awareness;
  ws.docname = docname;

  // Track connections on the document
  if (!doc.conns) {
    doc.conns = new Set();
  }
  doc.conns.add(ws);

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  ws.send(encoding.toUint8Array(encoder));

  // Handle awareness updates — use the shared awareness instance
  const awarenessHandler = ({ added, updated, removed }) => {
    const changedClients = added.concat(updated, removed);
    broadcastAwareness(awareness, changedClients, docname);
  };
  awareness.on('update', awarenessHandler);

  // Handle incoming messages
  ws.on('message', (message) => messageHandler(ws, new Uint8Array(message)));

  // Handle disconnection
  ws.on('close', () => {
    doc.conns.delete(ws);
    awareness.off('update', awarenessHandler);
    awarenessProtocol.removeAwarenessStates(awareness, [doc.clientID], 'disconnect');
    console.log(`[Disconnect] Client disconnected from: ${docname}`);

    // Clean up if no connections remain
    if (doc.conns.size === 0) {
      setTimeout(() => {
        if (doc.conns && doc.conns.size === 0) {
          docs.delete(docname);
          awarenessMap.delete(docname);
          console.log(`[Cleanup] Removed inactive document: ${docname}`);
        }
      }, 60000); // 1 minute grace period
    }
  });

  ws.on('error', (err) => {
    console.error('[Error] WebSocket:', err);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`[Server] Y-WebSocket running on ws://${HOST}:${PORT}`);
  console.log(`[Persist] Using LevelDB at: ${PERSIST_DIR}`);
  if (!JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET not set — authentication is DISABLED. Set JWT_SECRET for production.');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Shutdown] Closing server...');
  
  wss.clients.forEach((client) => client.close());
  
  await persistence.flushDB();
  
  server.close(() => {
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });
});
