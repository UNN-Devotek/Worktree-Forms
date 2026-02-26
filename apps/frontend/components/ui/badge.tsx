import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // ── Solid filled ──────────────────────────────────────────────────
        /** Brand blue */
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        /** Emerald green */
        secondary:
          "border-transparent bg-emerald-600 text-white shadow hover:bg-emerald-700",
        /** Red — errors, failures */
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        /** Dark amber — matches alternative button */
        alternative:
          "border-transparent bg-amber-700 text-white shadow hover:bg-amber-800",
        /** Orange — matches warning button */
        warning:
          "border-transparent bg-orange-500 text-white shadow hover:bg-orange-600",
        /** Bright green — success, completed */
        success:
          "border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-600",
        /** Sky blue — informational */
        info:
          "border-transparent bg-sky-500 text-white shadow hover:bg-sky-600",

        // ── Soft tinted (subtle background + colored text) ────────────────
        /** Active / live */
        active:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        /** Pending / awaiting */
        pending:
          "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        /** In progress / working */
        processing:
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        /** Done / resolved */
        done:
          "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400",
        /** Cancelled / archived */
        cancelled:
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
        /** High priority */
        high:
          "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
        /** Low priority */
        low:
          "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
        /** Outline — bordered, transparent background */
        outline:
          "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
