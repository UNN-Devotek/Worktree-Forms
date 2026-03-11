'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

/**
 * Syncs the NextAuth session into an Express-compatible access_token cookie.
 *
 * After login, only the NextAuth session-token cookie exists. The Express
 * backend needs its own JWT (access_token cookie). This component calls
 * /api/auth/backend-token once per session to bridge the gap, so individual
 * API calls don't all race through the 401-retry path.
 */
export function BackendTokenSync() {
    const { status } = useSession();
    const synced = useRef(false);

    useEffect(() => {
        if (status === 'authenticated' && !synced.current) {
            synced.current = true;
            fetch('/api/auth/backend-token', { credentials: 'include' }).catch((err) => {
                console.warn('[BackendTokenSync] Failed to sync backend token:', err);
            });
        }
        if (status === 'unauthenticated') {
            synced.current = false;
        }
    }, [status]);

    return null;
}
