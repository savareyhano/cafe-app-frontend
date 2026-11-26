import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { ROLE_LABEL } from "~/lib/format";
import type { User } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/icon";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PageFade } from "~/components/page-fade";

// Lives outside the route modules: React Router splits route files into their own chunks, so a
// context created in layout.tsx would be a different object in each page that imported it.
export const CmsContext = createContext<{ user: User; openNav: () => void; logout: () => void } | null>(null);
export const useCms = () => useContext(CmsContext)!;

/**
 * A CMS page in the console shell: the brand band carries the top bar and the heading, and the
 * work sheet rises out of it with rounded top corners.
 */
export function CmsPage({
  title,
  lead,
  actions,
  children,
}: {
  title: string;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, openNav, logout } = useCms();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <title>{title}</title>
      <div className="bg-band text-white">
        <div
          className={cn(
            "sticky top-0 z-30 flex min-h-16 items-center gap-2 bg-band px-4 py-3 transition-shadow lg:px-8",
            scrolled && "shadow-[0_6px_20px_-8px_#00000060]",
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/15 active:bg-white/25 lg:hidden"
            onClick={openNav}
            aria-label="Buka navigasi"
          >
            <Icon name="menu" className="size-5" />
          </Button>
          <div className="flex-1" />
          <ModeToggle onBand />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 pr-3 pl-1.5 text-white hover:bg-white/15 active:bg-white/25 aria-expanded:bg-white/15"
              >
                <span className="grid size-7 place-items-center rounded-full bg-white type-label-xs text-band">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-32 truncate">{user.username}</span>
                <Icon name="expand-more" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="type-body-xs text-ink-faint">{ROLE_LABEL[user.role]}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate("/cms/kata-sandi")}>
                <Icon name="password" />
                Ganti kata sandi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={logout}>
                <Icon name="logout" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <PageFade className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 pt-2 pb-20 lg:px-8">
          <div className="grid max-w-3xl gap-1">
            <h1 className="type-display-m leading-tight text-white">{title}</h1>
            {lead && <div className="type-body-m text-white/85">{lead}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </PageFade>
      </div>
      <main className="relative -mt-14 flex-1 rounded-t-2xl bg-background px-4 pt-6 pb-12 lg:px-8 lg:pt-8">
        <PageFade className="mx-auto grid max-w-[90rem] gap-6">{children}</PageFade>
      </main>
    </>
  );
}

/** White button for the band */
export const onBand = "bg-white text-[#25282A] hover:bg-[#F2F2F2] active:bg-[#E6E6E6]";
export const onBandOutline = "border-white/70 bg-transparent text-white hover:bg-white/15 active:bg-white/25";
