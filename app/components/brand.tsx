import { CAFE_LOGO_URL, CAFE_NAME, cafeInitials } from "~/lib/config";
import { cn } from "~/lib/utils";

// Brand slot: the cafe's logo, or its initials in a circle of the primary fill
export function BrandMark({ className, inverse }: { className?: string; inverse?: boolean }) {
  if (CAFE_LOGO_URL)
    return <img src={CAFE_LOGO_URL} alt="" width={36} height={36} className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full type-label-s tracking-wide",
        inverse ? "bg-white text-band" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      {cafeInitials}
    </span>
  );
}

export function Brand({ sub, className }: { sub?: string; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <BrandMark />
      <span className="grid min-w-0 leading-tight">
        <span className="truncate type-label-m leading-tight">{CAFE_NAME}</span>
        {sub && <span className="truncate type-body-xs text-ink-faint">{sub}</span>}
      </span>
    </span>
  );
}
