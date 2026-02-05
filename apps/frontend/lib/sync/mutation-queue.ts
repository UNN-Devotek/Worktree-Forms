
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'worktree-sync-db';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

export interface MutationRequest {
  id: string; // uuid
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string; // Last error message
}

interface SyncDB extends DBSchema {
  mutations: {
    key: string;
    value: MutationRequest;
    indexes: { 'by-timestamp': number };
  };
}

class MutationQueueData {
  private dbPromise: Promise<IDBPDatabase<SyncDB>>;

  constructor() {
    if (typeof window === 'undefined') {
        this.dbPromise = Promise.reject('IndexedDB not available on server');
        return;
    }
    this.dbPromise = openDB<SyncDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }

  async enqueue(request: Omit<MutationRequest, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    const db = await this.dbPromise;
    const id = crypto.randomUUID();
    const mutation: MutationRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };
    await db.put(STORE_NAME, mutation);
    return id;
  }

  async dequeue(): Promise<MutationRequest | undefined> {
    const db = await this.dbPromise;
    // Get oldest pending mutation
    // Since we want FIFO, we look for the smallest timestamp
    // Ideally we filter by status='pending' but IDB doesn't support compound queries easily without compound indexes
    // For simplicity, we just get all and filter in memory or use a cursor. 
    // Given the expected volume (offline for a day max), getAll is acceptable, or a cursor.
    // Let's use a cursor on timestamp index.
    
    let nextMutation: MutationRequest | undefined;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('by-timestamp');
    
    for await (const cursor of index.iterate()) {
        if (cursor.value.status === 'pending' || (cursor.value.status === 'processing' && this.isStale(cursor.value))) {
             nextMutation = cursor.value;
             break; // Found the oldest pending
        }
    }
    
    return nextMutation;
  }

  // Peek without locking or modifying status (sanity check)
  async peek(): Promise<MutationRequest | undefined> {
      return this.dequeue();
  }

  async updateStatus(id: string, status: MutationRequest['status'], error?: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.store;
    const mutation = await store.get(id);
    if (mutation) {
      mutation.status = status;
      if (error) mutation.error = error;
      if (status === 'failed') mutation.retryCount += 1;
      await store.put(mutation);
    }
    await tx.done;
  }

  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }

  async getCount(): Promise<number> {
      const db = await this.dbPromise;
      return db.count(STORE_NAME);
  }

  async getAll(): Promise<MutationRequest[]> {
     const db = await this.dbPromise;
     return db.getAll(STORE_NAME);
  }

  // If a mutation is stuck in 'processing' for > 5 minutes, assume crash and retry
  private isStale(mutation: MutationRequest): boolean {
      // 5 minutes timeout
      return Date.now() - mutation.timestamp > 5 * 60 * 1000; 
  }
}

export const MutationQueue = new MutationQueueData();
