import { cn } from "~/lib/utils";

// Names from the Apache-2.0 icon pack in scripts/icons-full.svg. public/icons.svg is trimmed to
// these by scripts/build-icons.mjs, so add a name here before using it.
export const ICONS = [
  "my-orders", "order-completion", "promo",
  "admin", "back", "bill", "block", "cancel", "cash", "copy", "correct", "cutlery-provided", "daily-needs",
  "dark-theme", "delete", "dish", "downloads", "downward", "edit", "error", "expand-less",
  "expand-more", "food-menu", "food-ready", "freshly-made", "group", "image", "info",
  "light-theme", "location", "logout", "menu", "minus", "next", "notes", "overflow-vertical",
  "password", "plus", "print", "rating", "reset-password", "retry", "scan", "search", "switch",
  "time-left", "timeline-bar-chart", "transactions", "upward", "user", "volume-up", "wallet",
] as const;

export type IconName = (typeof ICONS)[number];

export function Icon({
  name,
  className,
  label,
  style,
}: {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible name; omit for decorative icons */
  label?: string;
}) {
  return (
    <svg
      className={cn("size-4 shrink-0", className)}
      // an attribute, not a class: tailwind-merge reads fill-mode-* animation classes as fill colors
      fill="currentColor"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      data-icon
      style={style}
    >
      <use href={`/icons.svg#i-${name}`} />
    </svg>
  );
}
