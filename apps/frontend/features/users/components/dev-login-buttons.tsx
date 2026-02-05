"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input" // Unused

declare global {
  interface Window {
    tryTestLogin: (email: string) => Promise<any>;
  }
}

export function DevLoginButtons() {
  const searchParams = useSearchParams()
  const showDev = process.env.NODE_ENV === "development" || 
                  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true" ||
                  searchParams.get("dev") === "true"
                  
  const callbackUrl = searchParams.get("callbackUrl") || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : "/dashboard")

  useEffect(() => {
    if (showDev) {
      window.tryTestLogin = async (email: string) => {
        console.log("Window Test Login triggered for:", email);
        return signIn("credentials", { 
          email: email, 
          redirect: true,
          callbackUrl 
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => signIn("credentials", { 
            email: "admin@worktree.pro", 
            redirect: true,
            callbackUrl 
          })}
        >
          Dev Admin
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signIn("credentials", { 
            email: "user@worktree.com", 
            redirect: true,
            callbackUrl
          })}
        >
          Dev User
        </Button>
      </div>
    </div>
  )
}
