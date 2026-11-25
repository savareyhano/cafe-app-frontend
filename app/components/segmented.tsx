import { cn } from "~/lib/utils";

// Console tabs as filled pills. A radio group, so arrow keys move between options.
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = options[(i + d + options.length) % options.length];
    onChange(next.value);
    (e.currentTarget.parentElement?.children[(i + d + options.length) % options.length] as HTMLElement)?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex gap-1.5 overflow-x-auto [scrollbar-width:none]", className)}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => move(e, i)}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-4 type-label-s transition-colors duration-[120ms]",
              on ? "bg-primary text-primary-foreground" : "bg-surface text-ink-soft shadow-[inset_0_0_0_1px_var(--ds-line-strong)] hover:bg-fill-hover hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
