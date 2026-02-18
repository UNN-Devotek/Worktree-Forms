'use client';

import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

interface YjsState {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  persistence: IndexeddbPersistence | null;
  isConnected: boolean;
  users: any[];
  connect: (sheetId: string, token: string, user: { name: string; color: string; id?: string }) => void;
  disconnect: () => void;
}

// Helper: Get WebSocket URL from env or construct
const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:1234';

  // Use env var if set (production)
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // Construct from current URL (development)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = process.env.NEXT_PUBLIC_WS_PORT || '1234';

  return `${protocol}//${host}:${port}`;
};

export const useYjsStore = create<YjsState>((set, get) => ({
  doc: null,
  provider: null,
  persistence: null,
  isConnected: false,
  users: [],

  connect: (sheetId, token, user) => {
    // Clean up existing connection
    get().disconnect();

    const doc = new Y.Doc();

    // Offline Persistence
    const persistence = new IndexeddbPersistence(sheetId, doc);

    const wsUrl = getWebSocketUrl();
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    // Finding #3 (R5): Use y-websocket's WebsocketProvider — matches the backend
    // protocol (y-websocket-server.js), not HocuspocusProvider which speaks a
    // different wire format.
    // Finding #2 (R5): WebsocketProvider has built-in reconnect with backoff.
    // No manual onDisconnect retry needed (the old code created an infinite loop
    // because connect() calls disconnect() which triggers onDisconnect).
    const provider = new WebsocketProvider(
      wsUrl,
      sheetId,
      doc,
      {
        // Pass JWT token via URL params for y-websocket-server auth
        params: { token },
        // y-websocket handles reconnect automatically with exponential backoff
        connect: true,
      }
    );

    provider.on('status', ({ status }: { status: string }) => {
      console.log('📡 WebSocket status:', status);
      set({ isConnected: status === 'connected' });
    });

    provider.on('sync', () => {
      console.log('✅ Yjs document synced - data loaded');
    });

    // Awareness: track connected users
    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      set({ users: states });
    });

    // Set local user awareness
    provider.awareness.setLocalStateField('user', user);

    set({ doc, provider, persistence });
  },

  disconnect: () => {
    const { provider, doc, persistence } = get();
    if (provider) provider.destroy();
    if (persistence) persistence.destroy();
    if (doc) doc.destroy();
    set({ doc: null, provider: null, persistence: null, isConnected: false, users: [] });
  },
}));
