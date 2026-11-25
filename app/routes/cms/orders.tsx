import { useEffect, useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/orders";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api, errorMessage } from "~/lib/api";
import { formatDate, formatTime, PAYMENT_LABEL, rupiah, STATUS_BADGE, STATUS_LABEL } from "~/lib/format";
import { onAuthError, requireUser } from "~/lib/session";
import type { Order, OrderStatus, PaymentMethod } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/icon";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Pager } from "~/components/pager";
import { SearchInput } from "~/components/search-input";
import { Segmented } from "~/components/segmented";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Spinner } from "~/components/ui/spinner";
import { AnimatePresence, m } from "motion/react";
import { EASE_IN, EASE_OUT } from "~/components/page-fade";

const VIEWS = {
  active: { label: "Aktif", status: "pending,preparing,ready" },
  completed: { label: "Selesai", status: "completed" },
  cancelled: { label: "Dibatalkan", status: "cancelled" },
  all: { label: "Semua", status: "" },
} as const;
type View = keyof typeof VIEWS;

const PER_PAGE = 20;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser();
  const sp = new URL(request.url).searchParams;
  const view = (sp.get("lihat") as View) in VIEWS ? (sp.get("lihat") as View) : "active";
  const res = await api.orders({
    page: Number(sp.get("hal")) || 1,
    perPage: PER_PAGE,
    search: sp.get("cari") ?? "",
    status: VIEWS[view].status,
    paymentMethod: (sp.get("bayar") as PaymentMethod) || "",
    sortBy: "createdAt",
    // The active queue reads oldest first, like a kitchen ticket rail; history reads newest first
    sortOrder: view === "active" ? "asc" : "desc",
  });
  return { orders: res.data, pagination: res.pagination, view, fetchedAt: Date.now() };
}

export default function Orders({ loaderData }: Route.ComponentProps) {
  const { orders, pagination, view, fetchedAt } = loaderData;
  const [sp, setSp] = useSearchParams();
  const revalidator = useRevalidator();

  // 5 s polling while the tab is visible
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && revalidator.state === "idle" && revalidator.revalidate();
    const t = setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    return () => (clearInterval(t), document.removeEventListener("visibilitychange", tick));
  }, [revalidator]);

  const setParam = (key: string, value: string) =>
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev);
        value ? next.set(key, value) : next.delete(key);
        if (key !== "hal") next.delete("hal");
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const refreshing = revalidator.state === "loading";

  return (
    <CmsPage
      title="Pesanan"
      lead={
        <span aria-live="polite">
          Diperbarui otomatis tiap 5 detik · terakhir {formatTime(new Date(fetchedAt).toISOString())}
        </span>
      }
      actions={
        <Button className={onBand} size="sm" onClick={() => revalidator.revalidate()} disabled={refreshing}>
          <Icon name="retry" className={cn(refreshing && "animate-spin")} />
          Muat ulang
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Tampilkan"
          value={view}
          onChange={(v) => setParam("lihat", v === "active" ? "" : v)}
          options={Object.entries(VIEWS).map(([value, v]) => ({ value, label: v.label }))}
        />
        <div className="grid w-full grid-cols-[minmax(0,1fr)_10rem] gap-2 sm:w-[30rem] xl:ml-auto">
          <SearchInput
            defaultValue={sp.get("cari") ?? ""}
            onSearch={(q) => setParam("cari", q)}
            placeholder="Cari no. pesanan atau nama"
          />
          <NativeSelect
            size="sm"
            aria-label="Metode pembayaran"
            value={sp.get("bayar") ?? ""}
            onChange={(e) => setParam("bayar", e.target.value)}
          >
            <NativeSelectOption value="">Semua bayar</NativeSelectOption>
            <NativeSelectOption value="cash">Tunai</NativeSelectOption>
            <NativeSelectOption value="cashless">Non-tunai</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {orders.length === 0 ? (
        <Empty className="rounded-2xl bg-surface shadow-ds-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="my-orders" />
            </EmptyMedia>
            <EmptyTitle>{sp.get("cari") ? "Tidak ada pesanan yang cocok" : view === "active" ? "Belum ada pesanan aktif" : "Belum ada pesanan di sini"}</EmptyTitle>
            <EmptyDescription>
              {sp.get("cari")
                ? "Periksa ejaan nomor pesanan atau nama pelanggan, atau hapus pencarian."
                : view === "active"
                  ? "Pesanan baru dari meja muncul di sini otomatis. Halaman ini tidak perlu dimuat ulang."
                  : "Ganti tampilan di atas untuk melihat pesanan lain."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {/* New orders fade in, finished ones fade out, the rest glide to their new places */}
          <AnimatePresence initial={false}>
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onChanged={() => revalidator.revalidate()} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Pager pagination={pagination} onPage={(p) => setParam("hal", p === 1 ? "" : String(p))} noun="pesanan" />
    </CmsPage>
  );
}

function OrderCard({ order: fromServer, onChanged }: { order: Order; onChanged: () => void }) {
  const navigate = useNavigate();
  // Optimistic: show the new status as soon as the server accepts it, until the next fetch agrees
  const [applied, setApplied] = useState<OrderStatus | null>(null);
  useEffect(() => setApplied(null), [fromServer.status]);
  const order: Order = applied
    ? { ...fromServer, status: applied, paidAt: fromServer.paidAt ?? (applied === "preparing" ? new Date().toISOString() : null) }
    : fromServer;
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [confirm, setConfirm] = useState<"pay" | "cancel" | null>(null);
  const isNew = Date.now() - new Date(order.createdAt).getTime() < 3 * 60_000 && order.status !== "completed";

  const move = async (status: Exclude<OrderStatus, "pending">, success: string) => {
    setBusy(status);
    try {
      await api.updateOrderStatus(order.id, status);
      setApplied(status);
      toast.success(success, { description: `${order.invoiceNumber} · ${order.customerName}` });
      onChanged();
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Status gagal diubah", { description: errorMessage(e) });
      onChanged();
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const spin = <Spinner label={false} />;

  return (
    <m.li
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_IN } }}
      transition={{ layout: { duration: 0.3, ease: EASE_OUT } }}
      className={cn(
        "flex flex-col rounded-2xl bg-surface shadow-ds-1 dark:ring-1 dark:ring-border",
        order.status === "ready" && "ring-2 ring-[var(--ds-status-success)] dark:ring-[var(--ds-status-success)]",
      )}
    >
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h2 className="type-label-l">
            {order.customerName} · Meja {order.tableNumber}
          </h2>
          <p className="type-body-xs text-ink-faint tabular-nums">
            {formatDate(order.createdAt) !== formatDate(new Date().toISOString()) && `${formatDate(order.createdAt)}, `}
            {formatTime(order.createdAt)} · <span className="whitespace-nowrap">{order.invoiceNumber}</span>
            {isNew && <span className="type-label-xs text-info-ink"> · baru</span>}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
      </div>

      <ul className="mx-5 mt-4 grid gap-2 border-y py-3">
        {order.orderItems.map((it) => (
          <li key={it.id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-2 type-body-s">
            <span className="type-label-s tabular-nums">{it.quantity}×</span>
            <span className="min-w-0">
              <span className="type-label-s">{it.menuItems?.name ?? "Menu dihapus"}</span>
              {it.note && (
                <span className="mt-0.5 flex items-start gap-1 rounded-sm bg-warning-tint px-2 py-1 type-body-xs text-warning-ink">
                  <Icon name="notes" className="mt-px" />
                  {it.note}
                </span>
              )}
            </span>
            <span className="text-ink-soft tabular-nums">{rupiah(it.priceAtOrder * it.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 px-5 pt-3">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 type-body-s text-ink-soft">
          {PAYMENT_LABEL[order.paymentMethod]}
          {order.paidAt ? (
            <>
              <span aria-hidden>·</span>Lunas
              <InvoiceButton order={order} />
            </>
          ) : (
            order.status !== "cancelled" && (
              <>
                <span aria-hidden>·</span>
                <span className="text-warning-ink">Belum lunas</span>
              </>
            )
          )}
        </span>
        <span className="type-label-l tabular-nums">{rupiah(order.total)}</span>
      </div>

      <div className="flex items-center gap-2 px-5 pt-4 pb-5 empty:pt-0">
        {order.status === "pending" && order.paymentMethod === "cash" && (
          <Button size="sm" className="flex-1" onClick={() => setConfirm("pay")} disabled={!!busy}>
            {busy === "preparing" ? spin : <Icon name="cash" />}
            Terima pembayaran
          </Button>
        )}
        {order.status === "pending" && order.paymentMethod === "cashless" && (
          <p className="flex-1 type-body-s text-ink-soft">Menunggu pelanggan membayar online.</p>
        )}
        {order.status === "preparing" && (
          <>
            <Button size="sm" className="flex-1" onClick={() => move("ready", "Pelanggan diberi tahu pesanan siap")} disabled={!!busy}>
              {busy === "ready" ? spin : <Icon name="food-ready" />}
              Tandai siap
            </Button>
            <Button size="sm" variant="outline" onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
              {busy === "completed" && spin}
              Langsung selesai
            </Button>
          </>
        )}
        {order.status === "ready" && (
          <Button size="sm" className="flex-1" onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
            {busy === "completed" ? spin : <Icon name="correct" />}
            Sudah diambil
          </Button>
        )}
        {order.status === "pending" && (
          <Button size="sm" variant="destructive-outline" onClick={() => setConfirm("cancel")} disabled={!!busy}>
            Batalkan
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirm === "pay"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Terima ${rupiah(order.total)} tunai?`}
        description={`Dari ${order.customerName}, meja ${order.tableNumber} (${order.invoiceNumber}). Pesanan langsung masuk ke dapur setelah dikonfirmasi.`}
        confirmLabel="Uang sudah diterima"
        busy={busy === "preparing"}
        onConfirm={() => move("preparing", "Pembayaran diterima, pesanan disiapkan")}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Batalkan pesanan ini?"
        description={`${order.invoiceNumber} atas nama ${order.customerName}. Pesanan yang dibatalkan tidak bisa diaktifkan lagi.`}
        confirmLabel="Batalkan pesanan"
        cancelLabel="Jangan batalkan"
        destructive
        busy={busy === "cancelled"}
        onConfirm={() => move("cancelled", "Pesanan dibatalkan")}
      />
    </m.li>
  );
}

function InvoiceButton({ order }: { order: Order }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="xs"
      className="ml-1.5"
      aria-label={`Unduh invoice ${order.invoiceNumber}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await (await import("~/lib/invoice")).downloadInvoice(order);
        } catch (e) {
          toast.error("Invoice gagal diunduh", { description: errorMessage(e) });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner label={false} /> : <Icon name="downloads" />}
      Invoice
    </Button>
  );
}
