import { Button } from "~/components/ui/button";
import { Icon } from "~/components/icon";
import { MAX_QTY } from "~/lib/cart";

// Minus, quantity, plus in a brand-outlined pill
export function Stepper({ value, onChange, name }: { value: number; onChange: (n: number) => void; name: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line-brand bg-surface p-0.5">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(value - 1)}
        aria-label={value === 1 ? `Hapus ${name}` : `Kurangi ${name}`}
      >
        <Icon name={value === 1 ? "delete" : "minus"} />
      </Button>
      <output className="min-w-6 text-center type-label-s tabular-nums" aria-live="polite" aria-label={`Jumlah ${name}`}>
        {value}
      </output>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY}
        aria-label={`Tambah ${name}`}
      >
        <Icon name="plus" />
      </Button>
    </div>
  );
}
