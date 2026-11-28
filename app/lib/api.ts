import { API_BASE_URL } from "~/lib/config";
import type {
  Banner,
  DashboardData,
  MenuItem,
  ManualRefundReason,
  Order,
  OrderPart,
  OrderStatus,
  Pagination,
  PaymentMethod,
  Role,
  User,
} from "~/lib/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Backend messages are English; the UI speaks Indonesian. Known ones are translated, the rest
// fall back to a message for the status code.
const MESSAGES: Record<string, string> = {
  "Too many requests, please try again later": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
  Unauthorized: "Sesi Anda berakhir. Silakan masuk lagi.",
  Forbidden: "Akun Anda tidak punya akses untuk tindakan ini.",
  "Not found": "Data tidak ditemukan.",
  "Something went wrong": "Terjadi kesalahan di server. Coba lagi.",
  "Wrong email or password": "Nama pengguna atau kata sandi salah.",
  "Wrong password": "Kata sandi saat ini salah.",
  "A user with that username already exists": "Nama pengguna itu sudah dipakai.",
  "You cannot update your own account": "Anda tidak bisa mengubah akun sendiri dari sini.",
  "You cannot reset your own password": "Anda tidak bisa mereset kata sandi sendiri dari sini.",
  "You cannot delete your own account": "Anda tidak bisa menghapus akun sendiri.",
  "Order not found": "Pesanan tidak ditemukan.",
  "Menu item not found": "Menu tidak ditemukan. Mungkin sudah dihapus.",
  "Banner not found": "Banner tidak ditemukan.",
  "User not found": "Akun tidak ditemukan.",
  "Cancelled orders cannot be modified": "Pesanan yang dibatalkan tidak bisa diubah.",
  "Completed orders cannot be modified": "Pesanan yang selesai tidak bisa diubah.",
  "Only pending orders can be cancelled": "Hanya pesanan yang belum dibayar yang bisa dibatalkan.",
  "Ready orders can only transition to completed": "Pesanan siap hanya bisa ditandai selesai.",
  "Order part not found": "Bagian ini tidak ditemukan. Minta tautan baru ke teman Anda.",
  "Order part is already paid": "Bagian ini sudah dibayar.",
  "Order is no longer waiting for payment": "Pesanan ini sudah tidak menunggu pembayaran.",
  "Order part changed meanwhile, please try again": "Bagian ini baru saja berubah. Coba lagi.",
  "Order total is too small to split into that many parts": "Total pesanan terlalu kecil untuk dibagi sebanyak itu.",
  "bannerIds must include all existing banners": "Urutan banner berubah di tempat lain. Muat ulang lalu coba lagi.",
  "Failed to upload banner image": "Gagal mengunggah gambar. Coba lagi.",
};

function toMessage(status: number, raw: unknown): string {
  if (typeof raw === "string" && MESSAGES[raw]) return MESSAGES[raw];
  if (typeof raw === "string" && raw.startsWith("Order is already")) return "Status pesanan sudah diperbarui.";
  if (status === 400) return "Data yang dikirim tidak valid. Periksa kembali isian Anda.";
  if (status === 401) return MESSAGES.Unauthorized;
  if (status === 403) return MESSAGES.Forbidden;
  if (status === 404) return MESSAGES["Not found"];
  if (status === 409) return "Data berubah di tempat lain. Muat ulang lalu coba lagi.";
  if (status === 429) return MESSAGES["Too many requests, please try again later"];
  return MESSAGES["Something went wrong"];
}

type Query = Record<string, string | number | undefined | null>;

async function request<T>(
  path: string,
  { method = "GET", query, json, form }: { method?: string; query?: Query; json?: unknown; form?: FormData } = {},
): Promise<T> {
  const url = new URL(API_BASE_URL + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: json !== undefined ? JSON.stringify(json) : form,
    });
  } catch {
    throw new ApiError(0, "Tidak bisa terhubung ke server. Periksa koneksi internet Anda.");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, toMessage(res.status, body?.message));
  return body as T;
}

type Ok<T> = { status: "success"; data: T };
type PartView = { part: OrderPart; order: Order };
type RefundedPart = { partId: string; no: number; name: string | null; amount: number; paymentType: string | null };
/** What cancelling a split order did with the money already paid. */
export type CancelRefunds = {
  paidPartCount: number;
  refundAmount: number;
  refunds: {
    automatic: RefundedPart[];
    manual: (RefundedPart & { paymentMethod: PaymentMethod; reason: ManualRefundReason; detail: string | null })[];
  };
};

type SplitPart = { name?: string; paymentMethod?: PaymentMethod };
export type OrderSplit =
  | { mode: "even"; parts: SplitPart[] }
  | { mode: "item"; parts: (SplitPart & { items: { menuItemId: string; quantity: number }[] })[] };
type Paged<T> = Ok<T[]> & { pagination: Pagination };
type Msg = { status: "success"; message: string };

export type ListQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const api = {
  login: (username: string, password: string) =>
    request<Msg>("/api/auth/login", { method: "POST", json: { username, password } }),
  logout: () => request<Msg>("/api/auth/logout", { method: "POST", json: {} }),

  me: () => request<Ok<User>>("/api/users/me").then((r) => r.data),
  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<Msg>("/api/users/me/password", { method: "PATCH", json: body }),

  users: (q: ListQuery) => request<Paged<User>>("/api/users", { query: q }),
  addUser: (body: { username: string; role: Role }) =>
    request<Msg & { data: { userId: string; password: string } }>("/api/users", { method: "POST", json: body }),
  updateUser: (id: string, body: { username?: string; role?: Role }) =>
    request<Msg>(`/api/users/${id}`, { method: "PATCH", json: body }),
  resetUserPassword: (id: string) =>
    request<Msg & { data: { password: string } }>(`/api/users/${id}/password-reset`, { method: "POST" }),
  deleteUser: (id: string) => request<Msg>(`/api/users/${id}`, { method: "DELETE" }),

  menuItems: (q: ListQuery) => request<Paged<MenuItem>>("/api/menu/items", { query: q }),
  addMenuItem: (form: FormData) =>
    request<Msg & { data: { menuItemId: string } }>("/api/menu/item", { method: "POST", form }),
  updateMenuItem: (id: string, form: FormData) => request<Msg>(`/api/menu/item/${id}`, { method: "PATCH", form }),
  deleteMenuItem: (id: string) => request<Msg>(`/api/menu/item/${id}`, { method: "DELETE" }),

  publicBanners: () => request<Ok<Banner[]>>("/api/banners/public").then((r) => r.data),
  banners: (q: ListQuery) => request<Paged<Banner>>("/api/banners", { query: q }),
  addBanner: (form: FormData) =>
    request<Msg & { data: { bannerId: string } }>("/api/banners", { method: "POST", form }),
  updateBanner: (id: string, form: FormData) => request<Msg>(`/api/banners/${id}`, { method: "PATCH", form }),
  reorderBanners: (bannerIds: string[]) =>
    request<Msg>("/api/banners/reorder", { method: "PATCH", json: { bannerIds } }),
  deleteBanner: (id: string) => request<Msg>(`/api/banners/${id}`, { method: "DELETE" }),

  orders: (q: ListQuery & { status?: string; paymentMethod?: PaymentMethod | "" }) =>
    request<Paged<Order>>("/api/orders", { query: q }),
  order: (id: string) => request<Ok<Order>>(`/api/orders/${id}`).then((r) => r.data),
  addOrder: (body: {
    customerName: string;
    customerPhoneNumber?: string;
    tableNumber: number;
    paymentMethod: PaymentMethod;
    orderItems: { menuItemId: string; quantity: number; note?: string }[];
    split?: OrderSplit;
  }) =>
    request<
      Msg & { data: { orderId: string; invoiceNumber: string; redirectUrl: string | null; snapToken: string | null } }
    >("/api/orders", { method: "POST", json: body }),
  updateOrderStatus: (id: string, status: Exclude<OrderStatus, "pending">) =>
    request<Msg & { data?: CancelRefunds }>(`/api/orders/${id}`, {
      method: "PATCH",
      json: { status },
    }),
  /** Asks Midtrans directly, for when the payment webhook is late. Returns the latest order. */
  checkOrderPayment: (id: string) =>
    request<Ok<Order>>(`/api/orders/${id}/check-payment`, { method: "POST" }).then((r) => r.data),

  // Split orders: every part has its own page, payment and invoice
  orderPart: (id: string) => request<Ok<PartView>>(`/api/order-parts/${id}`).then((r) => r.data),
  setPartMethod: (id: string, paymentMethod: PaymentMethod) =>
    request<Ok<PartView>>(`/api/order-parts/${id}`, { method: "PATCH", json: { paymentMethod } }).then((r) => r.data),
  payPart: (id: string) => request<Ok<PartView>>(`/api/order-parts/${id}/pay`, { method: "POST" }).then((r) => r.data),
  checkPartPayment: (id: string) =>
    request<Ok<PartView>>(`/api/order-parts/${id}/check-payment`, { method: "POST" }).then((r) => r.data),
  markPartPaid: (id: string) =>
    request<Ok<PartView>>(`/api/order-parts/${id}/mark-paid`, { method: "POST" }).then((r) => r.data),

  dashboard: (q: { range?: string; startDate?: string; endDate?: string }) =>
    request<Ok<DashboardData>>("/api/dashboard", { query: q }).then((r) => r.data),
};

/** Fetches every page of a list endpoint (perPage is capped at 100 by the backend). */
export async function fetchAll<T>(fetchPage: (page: number) => Promise<Paged<T>>): Promise<T[]> {
  const first = await fetchPage(1);
  if (first.pagination.totalPages <= 1) return first.data;
  const rest = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, i) => fetchPage(i + 2)),
  );
  return first.data.concat(...rest.map((r) => r.data));
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.";
}
