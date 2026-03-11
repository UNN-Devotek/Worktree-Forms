"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    tryTestLogin: (email: string) => Promise<unknown>;
  }
}

export function DevLoginButtons() {
  const searchParams = useSearchParams()
  const showDev = process.env.NODE_ENV === "development" ||
                  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true" ||
                  searchParams.get("dev") === "true"

  const callbackUrl = searchParams.get("callbackUrl") || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : "/dashboard")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDevLogin = async (email: string, label: string) => {
    setLoading(label)
    setError(null)
    try {
      const result = await signIn("credentials", {
        email,
        password: "password",
        redirect: false,
        callbackUrl,
      })
      if (result?.error) {
        setError(`${label}: ${result.error}`)
        setLoading(null)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(`${label}: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(null)
    }
  }

  useEffect(() => {
    if (showDev) {
      window.tryTestLogin = async (email: string) => {
        return signIn("credentials", {
          email,
          password: "password",
          redirect: false,
          callbackUrl,
        });
      };
    }
  }, [showDev, callbackUrl]);

  if (!showDev) return null

  return (
    <div className="mt-6 border-t pt-6">
      <div className="mb-4 text-xs font-semibold uppercase text-muted-foreground text-center">
        Developer Tools
      </div>
      {error && (
        <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Button
          variant="secondary"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleDevLogin("admin@worktree.pro", "Admin")}
        >
          {loading === "Admin" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Dev Admin
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleDevLogin("user@worktree.com", "User")}
        >
          {loading === "User" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Dev User
        </Button>
      </div>
    </div>
  )
}
