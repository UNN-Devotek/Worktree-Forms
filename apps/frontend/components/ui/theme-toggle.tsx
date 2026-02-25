"use client"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <AnimatedThemeToggler
      className={cn("text-muted-foreground hover:text-foreground border-0 shadow-none hover:bg-accent", className)}
    />
  )
}
