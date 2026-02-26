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
  users: any[];
  connect: (sheetId: string, token: string, user: { name: string; color: string; id?: string }) => void;
  disconnect: () => void;
}

const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:1234';
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
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
    get().disconnect();

    const doc = new Y.Doc();

    // Offline persistence via IndexedDB
    const persistence = new IndexeddbPersistence(sheetId, doc);

    const wsUrl = getWebSocketUrl();
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    // HocuspocusProvider matches the @hocuspocus/server wire protocol exactly.
    // Auth token is sent via the Hocuspocus auth message (token option) so it
    // is never embedded in the URL and does not appear in server access logs.
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: sheetId,
      document: doc,
      token,
      onConnect: () => {
        console.log('📡 WebSocket status: connected');
        set({ isConnected: true });
      },
      onDisconnect: () => {
        console.log('📡 WebSocket status: disconnected');
        set({ isConnected: false });
      },
      onSynced: ({ state }: { state: boolean }) => {
        if (state) console.log('✅ Yjs document synced - data loaded');
      },
    });

    // Awareness: track connected users
    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      set({ users: states });
    });

    // Set local user info in awareness
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
