import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/layout";
import { api, errorMessage } from "~/lib/api";
import { clearSession, isAdmin, requireUser } from "~/lib/session";
import type { User } from "~/lib/types";
import { CAFE_NAME } from "~/lib/config";
import { ROLE_LABEL } from "~/lib/format";
import { cn } from "~/lib/utils";
import { BrandMark } from "~/components/brand";
import { CmsContext } from "~/components/cms-shell";
import { Icon, type IconName } from "~/components/icon";
import { Button } from "~/components/ui/button";
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

  const nav = <SidebarNav user={user} onLogout={logout} />;

  return (
    <CmsContext.Provider value={{ user, openNav: () => setNavOpen(true), logout }}>
      <div className="grid min-h-dvh bg-background lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col bg-band text-white lg:flex">{nav}</aside>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-72 gap-0 border-0 bg-band p-0 text-white" showCloseButton={false}>
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

/** Always dark, in both modes: the console's frame, with the work area beside it. */
function SidebarNav({ user, onLogout }: { user: User; onLogout: () => void }) {
  const admin = isAdmin(user);
  return (
    <>
      <div className="flex min-h-16 items-center gap-3 px-5 py-5">
        <BrandMark inverse />
        <span className="grid min-w-0 leading-tight">
          <span className="truncate font-brand text-lg leading-tight font-semibold">{CAFE_NAME}</span>
          <span className="truncate type-body-xs text-white/60">Konsol staf</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pt-2 pb-4" aria-label="Utama">
        <div className="grid gap-5">
          {NAV.map((group) => {
            const items = group.items.filter((i) => admin || !i.admin);
            if (!items.length) return null;
            return (
              <div key={group.label} className="grid gap-0.5">
                <p className="px-3 pb-1 type-label-xs text-white/50">{group.label}</p>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    prefetch="intent"
                    className={({ isActive }) =>
                      cn(
                        "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 type-label-s text-white/75 no-underline transition-[background-color,color,scale] duration-100 ease-out hover:bg-white/8 hover:text-white active:scale-[0.985] active:bg-white/12",
                        isActive && "bg-white/12 text-white hover:bg-white/12",
                      )
                    }
                  >
                    {/* The lime accent reads on this dark frame in both modes */}
                    <Icon name={item.icon} className="size-5 group-aria-[current=page]:text-[#B5E07A]" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </nav>
      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/12 type-label-s">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate type-label-s">{user.username}</span>
          <span className="truncate type-body-xs text-white/60">{ROLE_LABEL[user.role]}</span>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white/75 hover:bg-white/10 hover:text-white"
          onClick={onLogout}
          aria-label="Keluar"
        >
          <Icon name="logout" className="size-5" />
        </Button>
      </div>
    </>
  );
}
