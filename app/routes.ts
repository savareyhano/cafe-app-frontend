import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/order.tsx"),
  route("pesanan", "routes/order-status.tsx"),

  ...prefix("cms", [
    route("masuk", "routes/cms/login.tsx"),
    layout("routes/cms/layout.tsx", [
      index("routes/cms/index.tsx"),
      route("dasbor", "routes/cms/dashboard.tsx"),
      route("pesanan", "routes/cms/orders.tsx"),
      route("menu", "routes/cms/menu.tsx"),
      route("banner", "routes/cms/banners.tsx"),
      route("akun", "routes/cms/accounts.tsx"),
      route("qr-meja", "routes/cms/table-qr.tsx"),
      route("kata-sandi", "routes/cms/password.tsx"),
    ]),
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
