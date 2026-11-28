import { useState } from "react";

import type { IconName } from "~/components/icon";
import { readJson, writeJson } from "~/lib/storage";
import type { MenuItem, MenuType } from "~/lib/types";

// shortcut: categories, labels and availability live only in this browser (a design preview) because
// the backend has no fields for them yet; move them to the API when it does, and customers will see them.

export type Label = "best" | "promo" | "new";
export const LABELS: Record<Label, string> = { best: "Best Seller", promo: "Promo", new: "Baru" };
/** How a label badge looks, the same in the console and on the customer menu. */
export const LABEL_STYLE: Record<Label, { icon: IconName; className: string }> = {
  best: { icon: "rating", className: "bg-warning-tint text-warning-ink" },
  promo: { icon: "promo", className: "bg-danger-tint text-danger-ink" },
  new: { icon: "plus", className: "bg-info-tint text-info-ink" },
};

/** A display category. `type` is the backend's food/drink, which is what actually gets saved. */
export type Category = { id: string; name: string; type: MenuType };

type Demo = {
  categories: Category[];
  assign: Record<string, string>; // menu item id → category id
  labels: Record<string, Label>;
  off: string[]; // menu item ids marked "habis"
};

const DEFAULT: Demo = {
  categories: [
    { id: "utama", name: "Makanan Utama", type: "food" },
    { id: "snack", name: "Snack & Appetizer", type: "food" },
    { id: "coffee", name: "Coffee", type: "drink" },
    { id: "noncoffee", name: "Non-Coffee", type: "drink" },
    { id: "tea", name: "Tea & Refreshment", type: "drink" },
    { id: "dessert", name: "Dessert", type: "food" },
    { id: "addons", name: "Add-Ons", type: "food" },
  ],
  assign: {},
  labels: {},
  off: [],
};

const KEY = "menu-demo";

/** First guess for an item nobody has sorted yet, from its name and food/drink type. */
function guess(m: Pick<MenuItem, "name" | "type">, cats: Category[]): string | undefined {
  const n = m.name.toLowerCase();
  const id =
    m.type === "drink"
      ? /\bteh\b|\btea\b/.test(n)
        ? "tea"
        : /kopi|coffee|cappuccino|espresso|americano/.test(n)
          ? "coffee"
          : "noncoffee"
      : /cake|brownie|puding|dessert|es krim/.test(n)
        ? "dessert"
        : /pisang|roti|kentang|snack|tahu|tempe/.test(n)
          ? "snack"
          : "utama";
  return (cats.find((c) => c.id === id) ?? cats.find((c) => c.type === m.type) ?? cats[0])?.id;
}

export function useMenuDemo() {
  const [d, setD] = useState<Demo>(() => ({ ...DEFAULT, ...readJson<Partial<Demo>>(KEY, {}) }));
  const save = (next: Demo) => (setD(next), writeJson(KEY, next));

  const categoryOf = (m: Pick<MenuItem, "id" | "name" | "type">) => {
    const set = d.assign[m.id];
    return d.categories.some((c) => c.id === set) ? set : guess(m, d.categories);
  };

  return {
    categories: d.categories,
    categoryOf,
    labelOf: (id: string) => d.labels[id] as Label | undefined,
    isOff: (id: string) => d.off.includes(id),
    assign: (id: string, categoryId: string, label: Label | null) => {
      const labels = { ...d.labels };
      if (label) labels[id] = label;
      else delete labels[id];
      save({ ...d, assign: { ...d.assign, [id]: categoryId }, labels });
    },
    toggleOff: (id: string) =>
      save({ ...d, off: d.off.includes(id) ? d.off.filter((x) => x !== id) : [...d.off, id] }),
    addCategory: (name: string, type: MenuType) =>
      save({ ...d, categories: [...d.categories, { id: `c${Date.now()}`, name, type }] }),
    renameCategory: (id: string, name: string, type: MenuType) =>
      save({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, name, type } : c)) }),
    // Items in a removed category fall back to the guess from their name
    removeCategory: (id: string) => save({ ...d, categories: d.categories.filter((c) => c.id !== id) }),
  };
}

export type MenuDemo = ReturnType<typeof useMenuDemo>;
