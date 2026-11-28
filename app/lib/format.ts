import type { OrderStatus, PaymentMethod } from "~/lib/types";

const num = new Intl.NumberFormat("id-ID");

/** Rupiah without decimals, as Indonesian receipts write it: Rp25.000 */
export const rupiah = (n: number) => `Rp${num.format(Math.round(n))}`;

const dateOnly = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const timeOnly = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));
/** The one date-time style everywhere: 24 Nov 2026, 10.09 */
export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;

/** Minutes since the order came in, or the clock time once it's older than an hour. */
export function age(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  return mins < 1 ? "baru" : mins < 60 ? `${mins} mnt` : formatTime(createdAt);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Belum bayar",
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
  cash: "Tunai",
  cashless: "Non-tunai",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  credit_card: "Kartu kredit",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  dana: "DANA",
  ovo: "OVO",
  qris: "QRIS",
  kredivo: "Kredivo",
  akulaku: "Akulaku",
  bank_transfer: "Transfer bank",
  echannel: "Transfer bank",
  permata_va: "Transfer bank",
  cstore: "Gerai ritel",
};
/** "GoPay", "QRIS", "Transfer bank"… for a Midtrans payment_type; "Non-tunai" when unknown. */
export const paymentTypeLabel = (type: string | null | undefined) => (type && PAYMENT_TYPE_LABEL[type]) || "Non-tunai";

export const ROLE_LABEL = { staff: "Staf", admin: "Admin", super_admin: "Super admin" } as const;
export const TYPE_LABEL = { food: "Makanan", drink: "Minuman" } as const;
