import { useEffect, useState } from "react";
import { Link, useRevalidator } from "react-router";
import { toast } from "sonner";

import { errorMessage } from "~/lib/api";
import { CAFE_NAME } from "~/lib/config";
import { rupiah } from "~/lib/format";
import { partName, partPath, partTitle } from "~/lib/split";
import type { Order, OrderPart } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon, type IconName } from "~/components/icon";
import { ModeToggle } from "~/components/mode-toggle";
import { SiteFooter } from "~/components/site-footer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { Spinner } from "~/components/ui/spinner";

/** The customer's order and part pages: a back link to the menu, the title, the table and the theme toggle. */
export function Frame({ children, table, title = "Detail Pesanan" }: { children: React.ReactNode; table?: number; title?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col bg-canvas md:max-w-2xl">
      <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 bg-surface px-2 shadow-[0_1px_0_var(--ds-line)]">
        <Button asChild variant="ghost" size="icon-sm" className="text-ink">
          <Link to={table ? `/?meja=${table}` : "/"} aria-label="Kembali ke menu">
            <Icon name="back" className="size-5" />
          </Link>
        </Button>
        <h1 className="flex-1 truncate type-label-l">{title}</h1>
        {table && <Badge variant="solid">Meja {table}</Badge>}
        <ModeToggle />
      </header>
      <main className="grid flex-1 content-start gap-3 pt-4 pb-6">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function InfoRow({
  icon,
  title,
  sub,
  children,
}: {
  icon: IconName;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b py-4 last:border-b-0">
      <Icon name={icon} className="mt-0.5 size-5 text-ink-faint" />
      <div className="min-w-0 flex-1">
        <p className="type-label-s">{title}</p>
        {sub && <p className="type-body-s text-ink-soft">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

/** Downloads the order's invoice, or one part's own invoice for a split order. */
export function InvoiceButton({
  order,
  part,
  variant = "secondary",
  size,
  className,
}: {
  order: Order;
  part?: OrderPart;
  variant?: "secondary" | "ghost";
  size?: "sm";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={busy}
      aria-label={`Unduh invoice ${part?.invoiceNumber ?? order.invoiceNumber}`}
      onClick={async () => {
        setBusy(true);
        try {
          const { downloadInvoice } = await import("~/lib/invoice");
          await downloadInvoice(order, part);
        } catch (e) {
          toast.error("Invoice gagal diunduh", { description: errorMessage(e) });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner label={false} /> : <Icon name="downloads" />}
      {size === "sm" ? "Invoice" : "Unduh invoice"}
    </Button>
  );
}

export const POLL_MS = 5000;

/** Revalidates the loader every few seconds while the tab is visible. */
export function usePolling(active: boolean) {
  const { revalidate } = useRevalidator();
  useEffect(() => {
    if (!active) return;
    const tick = () => document.visibilityState === "visible" && revalidate();
    const t = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => (clearInterval(t), document.removeEventListener("visibilitychange", tick));
  }, [active, revalidate]);
}

/** A part's payment state in words, so it never rests on color alone. */
export function partStatus(part: OrderPart): { label: string; badge: "success" | "info" | "warning" } {
  if (part.paidAt) return { label: "Sudah dibayar", badge: "success" };
  if (part.paymentMethod === "cash") return { label: "Bayar di kasir", badge: "info" };
  return { label: "Belum bayar", badge: "warning" };
}

export function PartAvatar({ part }: { part: OrderPart }) {
  return part.paidAt ? (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-tint text-success-ink">
      <Icon name="correct" className="size-5" />
    </span>
  ) : (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted type-label-s text-ink-soft">
      {part.name ? part.name[0].toUpperCase() : part.no}
    </span>
  );
}

const partUrl = (part: OrderPart) => new URL(partPath(part.id), window.location.origin).toString();

/** Hands a part's link to the phone's share menu (WhatsApp and the rest), or copies it where there's none. */
export async function sharePart(order: Order, part: OrderPart) {
  const url = partUrl(part);
  const text = `Bayar ${partTitle(part).toLowerCase()} (${rupiah(part.amount)}) untuk pesanan ${order.invoiceNumber} di ${CAFE_NAME}.`;
  if (navigator.share) {
    try {
      await navigator.share({ title: partTitle(part), text, url });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  await copyPartLink(part);
}

export async function copyPartLink(part: OrderPart) {
  try {
    await navigator.clipboard.writeText(partUrl(part));
    toast.success(`Tautan ${partTitle(part).toLowerCase()} disalin`);
  } catch {
    toast.error("Tautan gagal disalin", { description: partUrl(part) });
  }
}

/** A big QR of the part's link, for the friend sitting at the same table. */
export function PartQrDialog({ order, part, onClose }: { order: Order; part: OrderPart | null; onClose: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!part) return setSrc("");
    let live = true;
    import("qrcode").then((QR) =>
      QR.toDataURL(partUrl(part), { margin: 1, width: 480, color: { dark: "#111111", light: "#ffffff" } }).then(
        (url) => live && setSrc(url),
      ),
    );
    return () => {
      live = false;
    };
  }, [part]);

  return (
    <Dialog open={!!part} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-4 text-center sm:max-w-sm">
        {part && (
          <>
            <div className="grid gap-1">
              <DialogTitle>Pindai untuk bayar</DialogTitle>
              <DialogDescription>
                {partTitle(part)} · <span className="tabular-nums">{rupiah(part.amount)}</span>
              </DialogDescription>
            </div>
            <div className="mx-auto grid size-56 place-items-center rounded-2xl bg-white p-3 ring-1 ring-border">
              {src ? <img src={src} alt={`Kode QR ${partTitle(part).toLowerCase()}`} className="size-full" /> : <Spinner />}
            </div>
            <p className="type-body-xs text-ink-soft">Arahkan kamera ponsel ke kode ini untuk membuka bagiannya.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => copyPartLink(part)}>
                <Icon name="copy" />
                Salin tautan
              </Button>
              <Button onClick={() => sharePart(order, part)}>Bagikan</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Everyone's share of a split order and whether it's paid. On the orderer's page each unpaid part
 * can be shared; on a part page the viewer's own row is marked.
 */
export function PartList({
  order,
  current,
  share = false,
  className,
}: {
  order: Order;
  current?: string;
  share?: boolean;
  className?: string;
}) {
  const [qr, setQr] = useState<OrderPart | null>(null);
  const open = order.status === "pending";
  return (
    <>
      <ul className={cn("grid", className)}>
        {order.orderParts.map((p) => {
          const st = partStatus(p);
          const mine = p.id === current;
          return (
            <li key={p.id} className="flex items-center gap-3 border-b py-3 last:border-b-0">
              <PartAvatar part={p} />
              <span className="grid min-w-0 flex-1">
                <Link to={partPath(p.id)} className="truncate type-label-s text-ink no-underline hover:underline">
                  {partName(p)}
                  {share && p.no === 1 && " (Anda)"}
                </Link>
                <span className="type-body-xs text-ink-soft tabular-nums">
                  {mine && "Bagian Anda · "}
                  {rupiah(p.amount)}
                  {share && ` · ${st.label}`}
                </span>
              </span>
              {share ? (
                p.paidAt ? (
                  <InvoiceButton order={order} part={p} size="sm" />
                ) : !open ? null : p.no === 1 ? (
                  <Button asChild size="sm">
                    <Link to={partPath(p.id)}>Bayar</Link>
                  </Button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setQr(p)} aria-label={`Tampilkan QR ${partTitle(p).toLowerCase()}`}>
                      <Icon name="scan" className="size-5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => sharePart(order, p)}>
                      Bagikan
                    </Button>
                  </span>
                )
              ) : (
                <Badge variant={st.badge}>{st.label}</Badge>
              )}
            </li>
          );
        })}
      </ul>
      <PartQrDialog order={order} part={qr} onClose={() => setQr(null)} />
    </>
  );
}
