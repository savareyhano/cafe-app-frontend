import { useEffect, useState } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, type Location } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { PageFade } from "~/components/page-fade";
import { Icon } from "~/components/icon";
import { themeScript } from "~/lib/theme";
import { CAFE_NAME } from "~/lib/config";

export const links: Route.LinksFunction = () => [
  // The sprite is on every screen; fetch it with the page rather than after the first icon renders
  { rel: "preload", href: "/icons.svg", as: "image", type: "image/svg+xml" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-mode="light" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <title>{CAFE_NAME}</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Starts downloading with the entry instead of waiting for the first render
const motionFeatures = import("~/lib/motion-features").then((m) => m.default);
const loadMotion = () => motionFeatures;

// The console animates inside its own shell (CmsPage); one key keeps the sidebar still.
// Order status pages are keyed with their order id so switching orders replays the entrance.
const pageKey = (l: Pick<Location, "pathname" | "search">) =>
  l.pathname.startsWith("/cms") ? "cms" : l.pathname === "/pesanan" ? l.pathname + l.search : l.pathname;

export default function App() {
  const location = useLocation();
  return (
    <LazyMotion features={loadMotion} strict>
      {/* Reduce motion: transforms are dropped, opacity fades stay */}
      <MotionConfig reducedMotion="user">
        <PageFade key={pageKey(location)} pageKey={pageKey} initial={pageKey(location) !== "cms"}>
          <Outlet />
        </PageFade>
      </MotionConfig>
    </LazyMotion>
  );
}

// Shown while the first route's data loads (SPA mode renders this into index.html)
export function HydrateFallback() {
  // The prerendered shell is the same for every path, so the label is picked after mount
  const [label, setLabel] = useState("Memuat…");
  useEffect(() => {
    const path = window.location.pathname;
    setLabel(path === "/" ? "Memuat menu…" : path.startsWith("/pesanan") ? "Memuat pesanan…" : "Memuat…");
  }, []);
  return (
    <div className="grid min-h-dvh place-items-center bg-background" aria-busy="true">
      {/* Waits 300 ms so fast loads never flash a spinner */}
      <div className="grid justify-items-center gap-3 animate-in fade-in fill-mode-both delay-300 duration-200 ease-out">
        <Spinner label={false} className="size-10 border-[3px] text-ink-brand" />
        <p role="status" className="type-body-s text-ink-soft">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? "Halaman tidak ditemukan" : "Ada yang tidak beres";
  const detail = notFound
    ? "Alamat ini tidak ada. Periksa tautannya atau kembali ke menu."
    : "Halaman gagal dimuat. Muat ulang, dan jika masih gagal, beri tahu staf kami.";

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="grid max-w-sm justify-items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-muted text-ink-soft">
          <Icon name="error" className="size-7" />
        </span>
        <h1 className="type-label-l">{title}</h1>
        <p className="type-body-s text-ink-soft">{detail}</p>
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="max-w-full overflow-x-auto rounded-lg bg-muted p-3 text-left text-xs">{error.message}</pre>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => location.reload()}>
            Muat ulang
          </Button>
          <Button asChild>
            <Link to="/">Ke menu</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
