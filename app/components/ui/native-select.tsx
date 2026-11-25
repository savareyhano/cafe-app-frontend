import * as React from "react"
import { cn } from "~/lib/utils"
import { fieldBase } from "~/components/ui/input"
import { Icon } from "~/components/icon"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

// Native select in the field pill: fast, and the OS picker on phones
function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn("group/native-select relative w-full", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          fieldBase,
          "h-12 appearance-none rounded-full pr-11 pl-5 data-[size=sm]:h-10 data-[size=sm]:pl-4 data-[size=sm]:text-sm"
        )}
        {...props}
      />
      <Icon
        name="expand-more"
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-soft"
      />
    </div>
  )
}

function NativeSelectOption(props: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />
}

export { NativeSelect, NativeSelectOption }
