import * as React from "react"
import { cn } from "~/lib/utils"

// A 48px pill with the darker field edge; focus moves the edge to near-black
export const fieldBase =
  "w-full min-w-0 border border-input bg-surface text-base text-foreground transition-[background-color,border-color] duration-[120ms] outline-none placeholder:text-ink-faint hover:bg-fill-hover focus-visible:border-[var(--ds-control-line-press)] disabled:cursor-not-allowed disabled:border-[var(--ds-control-disabled)] disabled:bg-fill-disabled disabled:text-ink-disabled aria-invalid:border-[var(--ds-control-invalid)] aria-invalid:shadow-[inset_0_0_0_1px_var(--ds-control-invalid)] read-only:bg-background"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        "h-12 rounded-full px-5 text-ellipsis file:mr-3 file:inline-flex file:h-8 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-semibold file:text-secondary-foreground",
        type === "file" && "pl-2 pt-[7px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
