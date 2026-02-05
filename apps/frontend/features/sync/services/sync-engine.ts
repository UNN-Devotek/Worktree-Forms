
import { MutationQueue, MutationRequest } from '@/lib/sync/mutation-queue';

type SyncEvent = 'sync-start' | 'sync-complete' | 'sync-failed' | 'online' | 'offline';
type SyncListener = (data?: any) => void;

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

  private emit(event: SyncEvent, data?: any) {
    this.listeners[event].forEach(l => l(data));
  }

  private handleOnline() {
    console.log('[SyncEngine] Online detected');
    this.emit('online');
    this.processQueue();
  }

  private handleOffline() {
      console.log('[SyncEngine] Offline detected');
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

        try {
           await this.performRequest(request);
           
           // Success: Remove from queue
           await MutationQueue.remove(request.id);
           processedCount++;
        } catch (err: any) {
           console.error('[SyncEngine] Failed request', request.id, err);
           failedCount++;
           
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
