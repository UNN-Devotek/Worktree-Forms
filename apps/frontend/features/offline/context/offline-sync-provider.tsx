

"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner" 
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { get, set, del, update } from 'idb-keyval';

interface OfflineSyncContextType {
  isOnline: boolean
  queueLength: number
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined)

const QUEUE_KEY = 'offline-queue';
const CONCURRENCY_LIMIT = 3;

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  const queryClient = useQueryClient()

  // Initial Load & Legacy Migration
  useEffect(() => {
     if (typeof window !== 'undefined') {
         setIsOnline(navigator.onLine);
         
         // Helper to migrate legacy localStorage to IDB
         const migrate = async () => {
             const legacy = localStorage.getItem(QUEUE_KEY);
             if (legacy) {
                 try {
                     const parsed = JSON.parse(legacy);
                     if (Array.isArray(parsed) && parsed.length > 0) {
                        await update(QUEUE_KEY, (val) => [...(val || []), ...parsed]);
                        toast.info("Migrated offline data to new storage.");
                     }
                 } catch (e) {
                     console.error("Migration failed", e);
                 }
                 localStorage.removeItem(QUEUE_KEY);
             }
         };
         
         migrate().then(() => updateQueueLength());
     }
  }, []);

  const updateQueueLength = async () => {
      const queue = (await get(QUEUE_KEY)) || [];
      setQueueLength(queue.length);
  };

  const processQueue = async () => {
      const queue = (await get(QUEUE_KEY)) || [];
      if (queue.length === 0) return;

      toast.info(`Syncing ${queue.length} items...`, { id: "sync-start" });

      const pending = [...queue];
      const nextQueue = []; 
      const processingBatch = [];
      let successCount = 0;
      let failureCount = 0;

      // Process in batches
      while (pending.length > 0) {
          const batch = pending.splice(0, CONCURRENCY_LIMIT);
          
          const results = await Promise.allSettled(batch.map(async (item: any) => {
              try {
                  if (item.type === 'submission') {
                       const { formId, data, stopId, location } = item.payload;
                       
                       await apiClient(`/api/forms/${formId}/submissions`, {
                           method: 'POST',
                           body: JSON.stringify({
                               data,
                               stopId,
                               location,
                               submittedAt: item.createdAt
                           })
                       });
                       
                       if (stopId) {
                           await fetch(`/api/routes/stops/${stopId}/status`, {
                               method: 'PATCH',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ status: 'completed' })
                           });
                           queryClient.invalidateQueries({ queryKey: ['stop', String(stopId)] });
                       }
                       return true; 
                  }
                  return false; // Unknown type
              } catch (err) {
                  console.error("Sync failed for item", item.id, err);
                  throw err; // will be rejected
              }
          }));

          // Handle Results
          results.forEach((res, index) => {
              if (res.status === 'fulfilled') {
                  successCount++;
              } else {
                  failureCount++;
                  nextQueue.push(batch[index]); // Keep failed item
              }
          });
      }

      // Save remaining items
      if (nextQueue.length > 0) {
          await set(QUEUE_KEY, nextQueue);
      } else {
          await del(QUEUE_KEY);
      }
      
      await updateQueueLength();

      if (successCount > 0) {
           queryClient.invalidateQueries({ queryKey: ['daily-route'] });
           toast.success(`Synced ${successCount} items.`, { id: "sync-complete" });
      }
      if (failureCount > 0) {
           toast.error(`${failureCount} items failed to sync.`, { id: "sync-error" });
      }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success("You are back online.", { id: "online-status" })
      processQueue();
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error("You are offline.", { id: "offline-status" })
    }

    const handleQueueUpdate = () => updateQueueLength();

    if (typeof window !== "undefined") {
        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        window.addEventListener("offline-queue-update", handleQueueUpdate)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
        window.removeEventListener("offline-queue-update", handleQueueUpdate)
      }
    }
  }, [queryClient])

  return (
    <OfflineSyncContext.Provider value={{ isOnline, queueLength }}>
      {children}
      {queueLength > 0 && isOnline && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-pulse flex items-center gap-2">
              <span className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent"></span>
              Syncing {queueLength} items...
          </div>
      )}
    </OfflineSyncContext.Provider>
  )
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext)
  if (context === undefined) {
    throw new Error("useOfflineSync must be used within an OfflineSyncProvider")
  }
  return context
}
