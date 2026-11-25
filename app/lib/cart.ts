import { useCallback, useEffect, useState } from "react";
import { readJson, writeJson } from "~/lib/storage";

export type CartLine = { menuItemId: string; quantity: number; note: string };

const KEY = "cart";
export const MAX_QTY = 100; // backend limit per line

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Read after mount: SPA prerenders index.html without storage
  useEffect(() => setLines(readJson<CartLine[]>(KEY, [])), []);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = fn(prev).filter((l) => l.quantity > 0);
      writeJson(KEY, next);
      return next;
    });
  }, []);

  const setQty = useCallback(
    (menuItemId: string, quantity: number) =>
      update((prev) => {
        const q = Math.max(0, Math.min(MAX_QTY, quantity));
        return prev.some((l) => l.menuItemId === menuItemId)
          ? prev.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: q } : l))
          : [...prev, { menuItemId, quantity: q, note: "" }];
      }),
    [update],
  );

  const setNote = useCallback(
    (menuItemId: string, note: string) =>
      update((prev) => prev.map((l) => (l.menuItemId === menuItemId ? { ...l, note } : l))),
    [update],
  );

  /** Drops lines whose menu item no longer exists. */
  const prune = useCallback(
    (validIds: Set<string>) => update((prev) => prev.filter((l) => validIds.has(l.menuItemId))),
    [update],
  );

  const clear = useCallback(() => update(() => []), [update]);

  const qtyOf = (id: string) => lines.find((l) => l.menuItemId === id)?.quantity ?? 0;

  return { lines, setQty, setNote, prune, clear, qtyOf };
}

const TABLE_KEY = "table";

/** Table number from the QR link (?meja=N), kept for this browser tab. */
export function readTable(search: URLSearchParams): number | null {
  const parse = (v: string | null) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null;
  };
  const fromUrl = parse(search.get("meja"));
  try {
    if (fromUrl) sessionStorage.setItem(TABLE_KEY, String(fromUrl));
    return fromUrl ?? parse(sessionStorage.getItem(TABLE_KEY));
  } catch {
    return fromUrl;
  }
}
