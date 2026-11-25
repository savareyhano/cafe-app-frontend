import { Button } from "~/components/ui/button";
import { Icon } from "~/components/icon";
import { setMode, useMode } from "~/lib/theme";
import { cn } from "~/lib/utils";

export function ModeToggle({ className, onBand }: { className?: string; onBand?: boolean }) {
  const mode = useMode();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(onBand && "text-white hover:bg-white/15 active:bg-white/25", !onBand && "text-ink-soft", className)}
      onClick={() => setMode(next)}
      aria-label={next === "dark" ? "Gunakan mode gelap" : "Gunakan mode terang"}
      title={next === "dark" ? "Mode gelap" : "Mode terang"}
    >
      <Icon name={mode === "dark" ? "light-theme" : "dark-theme"} className="size-5" />
    </Button>
  );
}
