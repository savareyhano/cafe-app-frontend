import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/utils"
import { Slot } from "radix-ui"

// Tag: pill, bold xs label, a tint per intent. Status always carries a word, never color alone.
const badgeVariants = cva(
  "inline-flex min-h-7 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-0.5 type-label-xs leading-tight whitespace-nowrap transition-colors duration-[240ms] ease-out [&>svg]:pointer-events-none [&>svg]:size-4!",
  {
    variants: {
      variant: {
        default: "bg-muted text-ink-soft",
        brand: "bg-secondary text-secondary-foreground",
        solid: "bg-primary text-primary-foreground",
        info: "bg-info-tint text-info-ink",
        success: "bg-success-tint text-success-ink",
        warning: "bg-warning-tint text-warning-ink",
        destructive: "bg-danger-tint text-danger-ink",
        outline: "bg-transparent text-ink-soft shadow-[inset_0_0_0_1px_var(--ds-line-strong)]",
      },
      size: {
        default: "",
        sm: "min-h-[1.375rem] px-2",
        lg: "min-h-8 px-4 type-label-s",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
