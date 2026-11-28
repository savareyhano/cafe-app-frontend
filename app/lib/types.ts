export type Role = "staff" | "admin" | "super_admin";
export type MenuType = "food" | "drink";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "cashless";
export type SplitMode = "item" | "even";

export type Pagination = {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
};

export type User = { id: string; username: string; role: Role };

export type MenuItem = {
  id: string;
  name: string;
  type: MenuType;
  imageUrl: string | null;
  description: string | null;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type BannerMenuItem = Pick<MenuItem, "id" | "name" | "type" | "imageUrl" | "price">;

export type Banner = {
  id: string;
  imageUrl: string;
  menuItemId: string | null;
  isActive?: boolean;
  position: number;
  menuItems: BannerMenuItem | null;
};

export type OrderItem = {
  id: string;
  note: string | null;
  priceAtOrder: number;
  quantity: number;
  menuItems: Pick<MenuItem, "id" | "name" | "imageUrl" | "description" | "price"> | null;
};

export type Order = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhoneNumber: string | null;
  tableNumber: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paidAt: string | null;
  redirectUrl: string | null;
  snapToken: string | null;
  /** null: paid as one. Otherwise the order is paid in `orderParts`. */
  splitMode: SplitMode | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  orderParts: OrderPart[];
};

/** One person's share of a split order, paid on its own with its own invoice number. */
export type OrderPart = {
  id: string;
  orderId: string;
  no: number;
  invoiceNumber: string;
  name: string | null;
  amount: number;
  /** null until someone picks how this part is paid */
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  redirectUrl: string | null;
  snapToken: string | null;
  snapExpiresAt: string | null;
  /** "Per item" mode only: which order items, and how many of each, this part pays for */
  orderPartItems: { id: string; orderItemId: string; quantity: number }[];
};

export type DashboardData = {
  period: { startDate: string; endDate: string; granularity: "day" | "hour" | string };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    averageOrderValue: number;
    activeMenuItems: number;
    activeBanners: number;
    previousPeriod: {
      totalRevenue: number;
      paidOrders: number;
      revenueChangePercent: number | null;
      ordersChangePercent: number | null;
    };
  };
  revenueChart: { date: string; revenue: number; ordersCount: number }[];
  ordersByStatus: Record<OrderStatus, number>;
  salesByCategory: { type: MenuType; quantitySold: number; revenue: number }[];
  salesByPaymentMethod: { paymentMethod: PaymentMethod; ordersCount: number; revenue: number }[];
  topMenuItems: (Pick<MenuItem, "id" | "name" | "type" | "imageUrl" | "price"> & {
    quantitySold: number;
    revenue: number;
  })[];
  recentOrders: Pick<
    Order,
    "id" | "invoiceNumber" | "customerName" | "tableNumber" | "total" | "paymentMethod" | "status" | "createdAt"
  >[];
};
