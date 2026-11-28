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
 * A CMS page in the console shell: a light top bar beside the dark sidebar, then the heading and
 * its actions, then the work area.
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
      <div
        className={cn(
          "sticky top-0 z-30 flex min-h-16 items-center gap-2 bg-background/90 px-4 py-3 backdrop-blur-sm transition-shadow lg:px-8",
          scrolled && "shadow-[0_1px_0_var(--ds-line)]",
        )}
      >
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={openNav} aria-label="Buka navigasi">
          <Icon name="menu" className="size-5" />
        </Button>
        <div className="flex-1" />
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 pr-3 pl-1.5 aria-expanded:bg-fill-hover">
              <span className="grid size-7 place-items-center rounded-full bg-band type-label-xs text-white">
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
      <main className="flex-1 px-4 pt-2 pb-12 lg:px-8">
        <PageFade className="mx-auto grid max-w-[90rem] gap-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="grid max-w-3xl gap-1">
              <h1 className="type-display-m leading-tight">{title}</h1>
              {lead && <div className="type-body-m text-ink-soft">{lead}</div>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </PageFade>
      </main>
    </>
  );
}

/** Page-heading action buttons. Was the white button for the old dark band; now the plain primary. */
export const onBand = "";
