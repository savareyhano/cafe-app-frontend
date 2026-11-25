import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/layout";
import { api, errorMessage } from "~/lib/api";
import { clearSession, isAdmin, requireUser } from "~/lib/session";
import type { User } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Brand } from "~/components/brand";
import { CmsContext } from "~/components/cms-shell";
import { Icon, type IconName } from "~/components/icon";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";

export async function clientLoader() {
  return { user: await requireUser() };
}

type NavItem = { to: string; label: string; icon: IconName; admin?: boolean };
const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Operasional",
    items: [
      { to: "/cms/dasbor", label: "Dasbor", icon: "timeline-bar-chart", admin: true },
      { to: "/cms/pesanan", label: "Pesanan", icon: "my-orders" },
    ],
  },
  {
    label: "Kelola",
    items: [
      { to: "/cms/menu", label: "Menu", icon: "food-menu", admin: true },
      { to: "/cms/banner", label: "Banner", icon: "promo", admin: true },
      { to: "/cms/qr-meja", label: "QR meja", icon: "scan", admin: true },
      { to: "/cms/akun", label: "Akun staf", icon: "group", admin: true },
    ],
  },
  {
    label: "Akun saya",
    items: [{ to: "/cms/kata-sandi", label: "Ganti kata sandi", icon: "password" }],
  },
];

export default function CmsLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setNavOpen(false), [location.pathname]);

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      toast.error("Gagal keluar", { description: errorMessage(e) });
      return;
    }
    clearSession();
    navigate("/cms/masuk", { replace: true });
  };

  const nav = <SidebarNav user={user} />;

  return (
    <CmsContext.Provider value={{ user, openNav: () => setNavOpen(true), logout }}>
      <div className="grid min-h-dvh bg-background lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-sidebar lg:flex">{nav}</aside>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-72 gap-0 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigasi</SheetTitle>
            {nav}
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-col">
          <Outlet />
        </div>
      </div>
    </CmsContext.Provider>
  );
}

function SidebarNav({ user }: { user: User }) {
  const admin = isAdmin(user);
  return (
    <>
      <div className="flex min-h-16 items-center px-5 py-4">
        <Brand sub="Konsol staf" />
      </div>
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pt-2 pb-4" aria-label="Utama">
        <div className="grid gap-5">
          {NAV.map((group) => {
            const items = group.items.filter((i) => admin || !i.admin);
            if (!items.length) return null;
            return (
              <div key={group.label} className="grid gap-0.5">
                <p className="px-3 pb-1 type-label-xs text-ink-faint">{group.label}</p>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    prefetch="intent"
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 type-label-s text-ink-soft no-underline transition-[background-color,color,scale] duration-100 ease-out hover:bg-fill-hover active:scale-[0.985] hover:text-ink active:bg-fill-press",
                        isActive && "bg-secondary text-ink-brand hover:bg-brand-tint-hover hover:text-ink-brand",
                      )
                    }
                  >
                    <Icon name={item.icon} className="size-5" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
