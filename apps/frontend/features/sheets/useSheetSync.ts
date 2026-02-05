
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const useSheetSync = (sheetId: string, initialContent?: number[] | null) => {
  const [doc] = useState(() => {
    const d = new Y.Doc();
    if (initialContent && initialContent.length > 0) {
        try {
            Y.applyUpdate(d, new Uint8Array(initialContent));
        } catch (e) {
            console.error("Failed to apply initial content", e);
        }
    }
    return d;
  });
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  const [token, setToken] = useState<string | null>(null);

  // 1. Fetch Token
  useEffect(() => {
     let mounted = true;
     
     const fetchToken = async () => {
         try {
             // We use a dedicated API route to get a signed JWT only if authorized
             const res = await fetch('/api/auth/ws-token');
             if (res.ok) {
                 const data = await res.json();
                 if (mounted && data.token) setToken(data.token);
             } else {
                 console.error("Failed to get WS token", res.status);
             }
         } catch (err) {
             console.error("Error fetching WS token", err);
         }
     };
     
     fetchToken();
     
     return () => { mounted = false; };
  }, []); // Run once on mount

  // 2. Connect Provider
  useEffect(() => {
    if (!token) return; // Wait for token

    // Default to localhost:1234 if env not set
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';
    
    // Check if doc/provider already exists matching this config?
    // We recreate if sheetId changes.
    
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `sheet-${sheetId}`, // Room name
      doc,
      { params: { token: token } } // Dynamic Auth token
    );

    wsProvider.on('status', (event: { status: string }) => {
      setIsSynced(event.status === 'connected');
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
    };
  }, [sheetId, doc, token]);

  return { doc, provider, isSynced };
};
