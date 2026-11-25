import type { OrderStatus, PaymentMethod } from "~/lib/types";

const num = new Intl.NumberFormat("id-ID");

/** Rupiah without decimals, as Indonesian receipts write it: Rp25.000 */
export const rupiah = (n: number) => `Rp${num.format(Math.round(n))}`;

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const timeOnly = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu pembayaran",
  preparing: "Disiapkan",
  ready: "Siap diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_BADGE: Record<OrderStatus, "warning" | "info" | "success" | "default" | "destructive"> = {
  pending: "warning",
  preparing: "info",
  ready: "success",
  completed: "default",
  cancelled: "destructive",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Tunai di kasir",
  cashless: "Non-tunai",
};

export const ROLE_LABEL = { staff: "Staf", admin: "Admin", super_admin: "Super admin" } as const;
export const TYPE_LABEL = { food: "Makanan", drink: "Minuman" } as const;
