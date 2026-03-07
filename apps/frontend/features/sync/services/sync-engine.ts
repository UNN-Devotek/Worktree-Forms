
import { MutationQueue, MutationRequest } from '@/lib/sync/mutation-queue';
import {
  recordSyncAttempt,
  markSyncSuccess,
  markSyncFailed,
} from '@/features/sync/server/sync-ledger-actions';

// ---------------------------------------------------------------------------
// Stable browser device token — stored in sessionStorage so it resets per tab
// but is consistent throughout a single sync session. We do NOT use
// localStorage directly per project rules; the sync feature owns this key.
// ---------------------------------------------------------------------------
const DEVICE_ID_KEY = 'wt_sync_device_id';

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Extract projectId from a mutation body for ledger scoping.
// Mutations are expected to include projectId in the body; fall back to sentinel.
function extractProjectId(request: MutationRequest): string {
  const body = request.body as Record<string, unknown> | null;
  return (typeof body?.projectId === 'string' ? body.projectId : '') || '__sync__';
}

type SyncEvent = 'sync-start' | 'sync-complete' | 'sync-failed' | 'online' | 'offline';
type SyncListener = (data?: unknown) => void;

class SyncEngineService {
  private isSyncing = false;
  private listeners: Record<SyncEvent, SyncListener[]> = {
    'sync-start': [],
    'sync-complete': [],
    'sync-failed': [],
    'online': [],
    'offline': [],
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  on(event: SyncEvent, listener: SyncListener) {
    this.listeners[event].push(listener);
    return () => {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    };
  }

  private emit(event: SyncEvent, data?: unknown) {
    this.listeners[event].forEach(l => l(data));
  }

  private handleOnline() {
    this.emit('online');
    this.processQueue();
  }

  private handleOffline() {
      this.emit('offline');
  }

  async processQueue() {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const count = await MutationQueue.getCount();
    if (count === 0) return;

    this.isSyncing = true;
    this.emit('sync-start');
    
    // Slight delay to allow UI to show "Syncing..."
    await new Promise(r => setTimeout(r, 500));

    let processedCount = 0;
    let failedCount = 0;

    try {
      while (true) {
        if (!navigator.onLine) break;

        const request = await MutationQueue.dequeue();
        if (!request) break;

        // Mark as processing
        await MutationQueue.updateStatus(request.id, 'processing');

        const deviceId = getDeviceId();
        const projectId = extractProjectId(request);

        // Record the attempt in the DynamoDB SyncLedger before executing.
        recordSyncAttempt(deviceId, request.id, projectId).catch(
          (err: unknown) => console.error('[SyncEngine] ledger recordSyncAttempt failed', err)
        );

        try {
           await this.performRequest(request);

           // Success: confirm in ledger, then remove from local queue.
           markSyncSuccess(deviceId, request.id, projectId).catch(
             (err: unknown) => console.error('[SyncEngine] ledger markSyncSuccess failed', err)
           );
           await MutationQueue.remove(request.id);
           processedCount++;
        } catch (err: any) {
           console.error('[SyncEngine] Failed request', request.id, err);
           failedCount++;

           const newRetryCount = request.retryCount + 1;

           // Record failure in ledger.
           markSyncFailed(deviceId, request.id, projectId, newRetryCount, err.message || 'Unknown error').catch(
             (ledgerErr: unknown) => console.error('[SyncEngine] ledger markSyncFailed failed', ledgerErr)
           );

           // If 500 or network error, retry later
           // If 400, it might be permanent. For now, we just retry everything with backoff/limit
           // Simple strategy: Update status to 'failed', increment retry.
           // If retry > 5, move to 'quarantine' (not implemented yet) or just leave as failed

           if (request.retryCount >= 5) {
               // Give up for now
                await MutationQueue.updateStatus(request.id, 'failed', err.message || 'Max retries reached');
           } else {
                await MutationQueue.updateStatus(request.id, 'pending', err.message || 'Network error');
           }

           // Stop processing queue if we hit an error to preserve order?
           // Or continue? "Store & Forward" strictly usually implies order matters.
           // If request A fails, and B depends on A, B shouldn't run.
           // So we BREAK on failure.
           break;
        }
      }

      if (processedCount > 0) {
          this.emit('sync-complete', processedCount);
      }
      
      if (failedCount > 0) {
          this.emit('sync-failed');
      }

    } finally {
      this.isSyncing = false;
    }
  }

  private async performRequest(request: MutationRequest) {
     // Execute the fetch
     const headers = request.headers || {};
     // Add X-Sync-Replay header so server knows (optional)
     headers['X-Sync-Replay'] = 'true';
     
     const res = await fetch(request.url, {
         method: request.method,
         credentials: 'include',
         headers,
         body: JSON.stringify(request.body)
     });
     
     if (!res.ok) {
         // Throw to trigger retry
         throw new Error(`Server returned ${res.status}`);
     }
     
     return await res.json();
  }
}

export const SyncEngine = new SyncEngineService();
