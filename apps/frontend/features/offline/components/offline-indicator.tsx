
"use client"

import { useOfflineSync } from "../context/offline-sync-provider"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline } = useOfflineSync()

  if (isOnline) return null

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top-full">
      <WifiOff className="h-4 w-4" />
      <span>You are currently working offline</span>
    </div>
  )
}
