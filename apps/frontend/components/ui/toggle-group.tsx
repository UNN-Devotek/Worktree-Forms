"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

// Extends ToggleGroupContext to include the active value so ToggleGroupItem
// can apply active styles as plain class names instead of aria-pressed: variants,
// which trigger a Turbopack CSS parser bug on button elements.
const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & { activeValue?: string | string[] }
>({
  size: "default",
  variant: "default",
})

// Cast Root to accept a wider onValueChange type, bypassing the discriminated union
// constraint that TS cannot narrow through spread. Runtime behaviour is correct.
type WiderRootProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
  'onValueChange'
> & {
  ref?: React.Ref<HTMLDivElement>;
  onValueChange?: (value: string | string[]) => void;
};
const WiderRoot = ToggleGroupPrimitive.Root as React.FC<WiderRootProps>;

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, onValueChange, ...props }, ref) => {
  // Access value/defaultValue across single and multiple union types
  const value = (props as { value?: string | string[] }).value;
  const defaultValue = (props as { defaultValue?: string | string[] }).defaultValue;

  const [localActiveValue, setLocalActiveValue] = React.useState<string | string[] | undefined>(
    value ?? defaultValue
  )
  const activeValue = value !== undefined ? value : localActiveValue

  const handleValueChange = React.useCallback((newValue: string | string[]) => {
    if (value === undefined) setLocalActiveValue(newValue)
    onValueChange?.(newValue as string & string[])
  }, [value, onValueChange])

  return (
    <WiderRoot
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
      onValueChange={handleValueChange}
    >
      <ToggleGroupContext.Provider value={{ variant, size, activeValue }}>
        {children}
      </ToggleGroupContext.Provider>
    </WiderRoot>
  )
})

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, value, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  const isActive = Array.isArray(context.activeValue)
    ? context.activeValue.includes(value)
    : context.activeValue === value

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      value={value}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
