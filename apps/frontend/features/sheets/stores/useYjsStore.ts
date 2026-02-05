'use client';

import { create } from 'zustand';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';

interface YjsState {
  doc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  persistence: IndexeddbPersistence | null;
  isConnected: boolean;
  reconnectAttempts: number;
  users: any[];
  connect: (sheetId: string, token: string, user: { name: string; color: string }) => void;
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
  reconnectAttempts: 0,
  users: [],

  connect: (sheetId, token, user) => {
    // Clean up existing connection
    get().disconnect();

    const doc = new Y.Doc();

    // Offline Persistence
    const persistence = new IndexeddbPersistence(sheetId, doc);

    const wsUrl = getWebSocketUrl();
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: sheetId,
      document: doc,
      token, // Pass token for JWT authentication

      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        set({ isConnected: true, reconnectAttempts: 0 });
      },

      onDisconnect: ({ event }) => {
        console.warn('❌ Disconnected from WebSocket', event);
        set({ isConnected: false });

        // Exponential backoff retry
        const attempts = get().reconnectAttempts;
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30s

        console.log(`🔄 Retrying connection in ${delay}ms (attempt ${attempts + 1})`);

        setTimeout(() => {
          set({ reconnectAttempts: attempts + 1 });
          get().connect(sheetId, token, user);
        }, delay);
      },

      onSynced: () => {
        console.log('✅ Yjs document synced - data loaded');
      },

      onStatus: ({ status }) => {
        console.log('📡 WebSocket status:', status);
      },

      onAwarenessUpdate: ({ states }) => {
        set({ users: Array.from(states.values()) });
      },
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
    set({ doc: null, provider: null, persistence: null, isConnected: false });
  },
}));
