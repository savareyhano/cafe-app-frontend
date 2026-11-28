import type { Order, OrderPart } from "~/lib/types";

export const MAX_PARTS = 10;

/** A part's name as people see it: the name typed at checkout, else "Bagian 2". */
export const partName = (part: Pick<OrderPart, "name" | "no">) => part.name || `Bagian ${part.no}`;
/** "Bagian Budi", or "Bagian 3" when unnamed (never "Bagian Bagian 3"). */
export const partTitle = (part: Pick<OrderPart, "name" | "no">) => `Bagian ${part.name || part.no}`;

/** Same rule as the backend: part 1 takes the rupiah remainder (100000 / 3 = 33334, 33333, 33333). */
export function splitEvenly(total: number, count: number) {
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, i) => (i === 0 ? total - base * (count - 1) : base));
}

/** What a part pays for, as receipt lines: its share of the items, or one line for an even share. */
export function partLines(order: Order, part: OrderPart) {
  if (order.splitMode === "even") {
    return [{ name: `1/${order.orderParts.length} bagian pesanan ${order.invoiceNumber}`, quantity: 1, price: part.amount }];
  }
  return part.orderPartItems.flatMap((pi) => {
    const item = order.orderItems.find((it) => it.id === pi.orderItemId);
    return item ? [{ name: item.menuItems?.name ?? "Menu dihapus", quantity: pi.quantity, price: item.priceAtOrder }] : [];
  });
}

/** One short line: "1× Mie Goreng Udang, 1× Es Teh Manis", or "1/3 bagian" for an even split. */
export function partSummary(order: Order, part: OrderPart) {
  if (order.splitMode === "even") return `1/${order.orderParts.length} bagian`;
  return partLines(order, part)
    .map((l) => `${l.quantity}× ${l.name}`)
    .join(", ");
}

/** How far a split order's payment has got. */
export function splitProgress(order: Order) {
  const unpaid = order.orderParts.filter((p) => !p.paidAt);
  return {
    count: order.orderParts.length,
    paid: order.orderParts.length - unpaid.length,
    left: unpaid.reduce((n, p) => n + p.amount, 0),
  };
}

/** Link to a part's own page; it's what friends get when the orderer shares their part. */
export const partPath = (partId: string) => `/bagian?id=${partId}`;
