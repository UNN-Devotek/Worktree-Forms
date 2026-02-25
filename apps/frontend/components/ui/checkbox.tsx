"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
  // Track state locally to support runtime conditional classes.
  // Avoids data-[state=checked]: Tailwind variants which trigger a Turbopack
  // CSS parser bug that generates invalid compound selectors on button elements.
  const [localChecked, setLocalChecked] = React.useState<
    CheckboxPrimitive.CheckedState
  >(checked !== undefined ? checked : (defaultChecked ?? false))

  const isChecked = checked !== undefined ? checked : localChecked

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(value) => {
        if (checked === undefined) setLocalChecked(value)
        onCheckedChange?.(value)
      }}
      className={cn(
        "relative grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 before:content-[''] before:absolute before:-inset-3 before:block md:before:hidden",
        isChecked === true && "bg-primary text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("grid place-content-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
