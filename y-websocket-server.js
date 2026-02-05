#!/usr/bin/env node

/**
 * Y-WebSocket Server with LevelDB Persistence
 * 
 * This server provides real-time collaboration via WebSockets
 * with persistent storage using LevelDB.
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

// Initialize LevelDB persistence
const persistence = new LeveldbPersistence(PERSIST_DIR);

// Store active documents
const docs = new Map();

// Get or create a Yjs document
const getYDoc = async (docname) => {
  if (docs.has(docname)) {
    return docs.get(docname);
  }

  const doc = new Y.Doc();
  docs.set(docname, doc);

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

// Message types
const messageSync = 0;
const messageAwareness = 1;

// Handle WebSocket messages
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

// Broadcast awareness updates
const broadcastAwareness = (awareness, changedClients) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageAwareness);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
  );
  const message = encoding.toUint8Array(encoder);

  awareness.doc.conns.forEach((conn) => {
    if (conn.readyState === conn.OPEN) {
      conn.send(message);
    }
  });
};

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Y-WebSocket Server with LevelDB Persistence\\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws, req) => {
  const docname = req.url.slice(1).split('?')[0];
  
  if (!docname) {
    ws.close();
    return;
  }

  console.log(`[Connection] Client connected to: ${docname}`);

  const doc = await getYDoc(docname);
  const awareness = new awarenessProtocol.Awareness(doc);

  ws.doc = doc;
  ws.awareness = awareness;

  // Track connections
  if (!doc.conns) {
    doc.conns = new Set();
  }
  doc.conns.add(ws);

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  ws.send(encoding.toUint8Array(encoder));

  // Handle awareness updates
  awareness.on('update', ({ added, updated, removed }) => {
    const changedClients = added.concat(updated, removed);
    broadcastAwareness(awareness, changedClients);
  });

  // Handle incoming messages
  ws.on('message', (message) => messageHandler(ws, new Uint8Array(message)));

  // Handle disconnection
  ws.on('close', () => {
    doc.conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(awareness, [ws], 'disconnect');
    console.log(`[Disconnect] Client disconnected from: ${docname}`);

    // Clean up if no connections
    if (doc.conns.size === 0) {
      setTimeout(() => {
        if (doc.conns.size === 0) {
          docs.delete(docname);
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
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n[Shutdown] Closing server...');
  
  // Close all connections
  wss.clients.forEach((client) => client.close());
  
  // Flush pending saves
  await persistence.flushDB();
  
  server.close(() => {
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });
});
