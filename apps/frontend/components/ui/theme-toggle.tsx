"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
        <Button variant="ghost" size="icon" className={cn("h-9 w-9", className)} disabled>
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("h-9 w-9 text-muted-foreground hover:text-primary", className)}
      title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <FontAwesomeIcon
        icon={resolvedTheme === "dark" ? faSun : faMoon}
        className="h-4 w-4 transition-all"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
