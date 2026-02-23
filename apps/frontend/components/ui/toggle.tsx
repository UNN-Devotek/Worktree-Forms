"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Avoids aria-pressed: Tailwind variants in CVA which trigger a Turbopack
// CSS parser bug that appends "button" to attribute-based compound selectors.
// Active state is tracked via useState and applied as plain class names.
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, pressed, defaultPressed, onPressedChange, ...props }, ref) => {
  const [localPressed, setLocalPressed] = React.useState(pressed ?? defaultPressed ?? false)
  const isPressed = pressed !== undefined ? pressed : localPressed

  return (
    <TogglePrimitive.Root
      ref={ref}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={(p) => {
        if (pressed === undefined) setLocalPressed(p)
        onPressedChange?.(p)
      }}
      className={cn(
        toggleVariants({ variant, size }),
        isPressed && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    />
  )
})

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
