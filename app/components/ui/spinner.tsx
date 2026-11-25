import { cn } from "~/lib/utils"

/** Muted full ring with an arc in the text colour, one turn per 0.8 s. Keeps turning under reduced motion (app.css). */
function Spinner({
  className,
  label = "Memuat",
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { label?: string | false }) {
  return (
    <span
      data-slot="spinner"
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
      className={cn(
        "inline-block size-4 shrink-0 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[color-mix(in_srgb,currentColor_25%,transparent)] border-t-current",
        className,
      )}
      {...props}
    />
  )
}

export { Spinner }
