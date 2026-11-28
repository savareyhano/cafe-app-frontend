// Split-bill calculator for checkout. It only shows amounts; the order is still paid once.

/** One cart line. */
export type SplitLine = { id: string; price: number; quantity: number };

/** Rounds a share up to Rp100 so the shares always cover the bill (cents first, against float noise). */
const roundUp = (n: number) => Math.ceil(Math.round(n * 100) / 100 / 100) * 100;

export function equalShares(total: number, people: number): number[] {
  return Array.from({ length: people }, () => roundUp(total / people));
}

/**
 * `taken[lineId][p]` is how many portions of that line person p (0-based) ordered. Portions
 * nobody took are split equally between everyone. Counts above what is left are ignored, so a
 * cart that shrank after the split was set still adds up.
 */
export function personShares(
  lines: SplitLine[],
  people: number,
  taken: Record<string, (number | undefined)[]>,
): { shares: number[]; unassigned: number } {
  const raw = Array<number>(people).fill(0);
  let unassigned = 0;
  for (const line of lines) {
    let left = line.quantity;
    for (let p = 0; p < people; p++) {
      const n = Math.min(taken[line.id]?.[p] ?? 0, left);
      raw[p] += n * line.price;
      left -= n;
    }
    unassigned += left * line.price;
  }
  return { shares: raw.map((r) => roundUp(r + unassigned / people)), unassigned };
}
