"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary action — brand blue */
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        /** Positive / confirm — emerald green */
        secondary:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
        /** Destructive / delete — pure red */
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        /** Alternative — dark amber */
        alternative:
          "bg-amber-700 text-white shadow-sm hover:bg-amber-800",
        /** Warning — orange */
        warning:
          "bg-orange-500 text-white shadow-sm hover:bg-orange-600",
        /** Neutral — slate, for low-semantic solid actions */
        neutral:
          "bg-slate-700 text-white shadow-sm hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500",
        /** Muted — dark grey, for inactive / unavailable actions */
        muted:
          "bg-zinc-500 text-white shadow-sm cursor-not-allowed hover:bg-zinc-500",
      },
      size: {
        default: "h-9 px-4 text-sm",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-md px-6 text-sm",
        xl:      "h-12 rounded-md px-8 text-base",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const contentVariants = {
  enter:  { opacity: 0, y: 6,  scale: 0.9 },
  center: { opacity: 1, y: 0,  scale: 1   },
  exit:   { opacity: 0, y: -6, scale: 0.9 },
}

const contentTransition = { duration: 0.15, ease: "easeOut" as const }

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  isLoaded?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, isLoaded, children, ...props }, ref) => {
    const innerRef = React.useRef<HTMLButtonElement>(null)
    const [lockedWidth, setLockedWidth] = React.useState<number | undefined>(undefined)
    const [showSuccess, setShowSuccess] = React.useState(false)

    // Width lock: freeze button width while loading
    React.useEffect(() => {
      if (isLoading && innerRef.current) {
        setLockedWidth(innerRef.current.offsetWidth)
      } else if (!isLoading) {
        setLockedWidth(undefined)
      }
    }, [isLoading])

    // Success flash
    React.useEffect(() => {
      if (isLoaded) {
        setShowSuccess(true)
        const timer = setTimeout(() => setShowSuccess(false), 600)
        return () => clearTimeout(timer)
      }
      return undefined
    }, [isLoaded])

    // asChild path: no animations, pass through as before
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    const isMuted = variant === "muted"
    const isInteractive = !isMuted && !isLoading && !isLoaded

    type Layer = "label" | "spinner" | "check"
    const layer: Layer = isLoading ? "spinner" : isLoaded ? "check" : "label"

    const motionTransition = isLoading
      ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: 0.15, ease: "easeOut" as const }

    // Separate style and conflicting drag handlers from rest props
    const {
      style: propsStyle,
      onDrag: _onDrag,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      onAnimationStart: _onAnimationStart,
      ...restProps
    } = props

    return (
      <motion.button
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative overflow-hidden",
          isLoading && "cursor-wait pointer-events-none",
          showSuccess && "!bg-emerald-500",
        )}
        ref={(node: HTMLButtonElement | null) => {
          innerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }}
        disabled={isLoading || restProps.disabled}
        style={{
          ...propsStyle,
          ...(lockedWidth ? { width: lockedWidth } : {}),
        }}
        whileHover={
          isInteractive
            ? { y: -1, scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }
            : undefined
        }
        whileTap={
          isInteractive
            ? { scale: 0.97, y: 0 }
            : undefined
        }
        animate={
          isLoading
            ? { opacity: [1, 0.82, 1] }
            : undefined
        }
        transition={motionTransition}
        {...(restProps as Omit<typeof restProps, "onTransitionEnd">)}
      >
        <AnimatePresence mode="wait" initial={false}>
          {layer === "label" && (
            <motion.span
              key="label"
              className="inline-flex items-center gap-2"
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={contentTransition}
            >
              {children as React.ReactNode}
            </motion.span>
          )}

          {layer === "spinner" && (
            <motion.svg
              key="spinner"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={contentTransition}
            >
              <motion.path
                d="M12 2a10 10 0 0 1 10 10"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
              />
            </motion.svg>
          )}

          {layer === "check" && (
            <motion.svg
              key="check"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={contentTransition}
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
