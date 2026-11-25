import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/utils"
import { Slot } from "radix-ui"

// Every action control is a full pill. Variants set emphasis (primary=default, secondary=outline,
// tertiary=secondary, nude=ghost); danger is the only other intent.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-transparent font-semibold leading-none whitespace-nowrap select-none transition-[background-color,border-color,color,scale] duration-100 ease-out active:scale-[0.97] data-[variant=link]:active:scale-100 disabled:pointer-events-none disabled:border-transparent disabled:bg-fill-disabled disabled:text-ink-disabled aria-disabled:pointer-events-none aria-disabled:bg-fill-disabled aria-disabled:text-ink-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-hover active:bg-brand-press",
        outline:
          "border-[var(--ds-control-line)] bg-surface text-ink-brand hover:bg-brand-tint-hover active:bg-brand-tint-press",
        secondary: "bg-secondary text-secondary-foreground hover:bg-brand-tint-hover active:bg-brand-tint-press",
        ghost: "bg-transparent text-ink-brand hover:bg-brand-tint-hover active:bg-brand-tint-press aria-expanded:bg-brand-tint-hover",
        destructive: "bg-danger text-white hover:bg-danger-hover active:bg-danger-press",
        "destructive-outline":
          "border-[var(--ds-control-line)] bg-surface text-danger-ink hover:bg-danger-tint-hover active:bg-[var(--ds-fill-danger-tint-press)]",
        link: "h-auto! rounded-sm border-0 px-0! text-ink-brand underline underline-offset-4 hover:decoration-2",
      },
      size: {
        default: "h-12 px-7 text-base",
        xs: "h-8 gap-1.5 px-3.5 text-xs",
        sm: "h-10 gap-1.5 px-5 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-12",
        "icon-xs": "size-8",
        "icon-sm": "size-10",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
