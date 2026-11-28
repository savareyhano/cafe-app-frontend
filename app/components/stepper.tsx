import { Button } from '~/components/ui/button';
import { Icon } from '~/components/icon';
import { MAX_QTY } from '~/lib/cart';

// Minus, quantity, plus in a brand-outlined pill
export function Stepper({
  value,
  onChange,
  name,
  min = 0,
  max = MAX_QTY,
}: {
  value: number;
  onChange: (n: number) => void;
  name: string;
  min?: number;
  max?: number;
}) {
  const willRemove = min === 0 && value === 1; // at 0 (split bill) a plain, disabled minus
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line-brand bg-surface p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={willRemove ? `Hapus ${name}` : `Kurangi ${name}`}
      >
        <Icon name={willRemove ? 'delete' : 'minus'} />
      </Button>
      <output
        className="min-w-6 text-center type-label-s tabular-nums"
        aria-live="polite"
        aria-label={`Jumlah ${name}`}
      >
        {value}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Tambah ${name}`}
      >
        <Icon name="plus" />
      </Button>
    </div>
  );
}
