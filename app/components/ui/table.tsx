import * as React from "react"
import { cn } from "~/lib/utils"

// Table frame: 1.5rem corners, low shadow (a hairline in dark mode), scrolls sideways
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-2xl bg-surface shadow-ds-1 [scrollbar-width:thin] dark:ring-1 dark:ring-border"
    >
      <table data-slot="table" className={cn("w-full type-body-s text-ink", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("bg-background", className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b transition-colors duration-[120ms] data-[state=selected]:bg-[var(--ds-highlight)]", className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("px-[0.9375rem] py-[0.8125rem] text-left align-middle type-label-xs whitespace-nowrap text-ink-soft", className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-[0.9375rem] py-[0.8125rem] align-middle", className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell }
