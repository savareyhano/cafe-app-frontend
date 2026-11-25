import * as React from "react"
import { cn } from "~/lib/utils"
import { fieldBase } from "~/components/ui/input"

// Multi-line fields relax the pill to 1rem corners
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "flex field-sizing-content min-h-24 rounded-lg px-4 py-3 leading-normal", className)}
      {...props}
    />
  )
}

export { Textarea }
