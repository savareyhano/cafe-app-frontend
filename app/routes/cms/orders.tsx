import { useEffect, useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";

import type { Route } from "./+types/orders";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api, errorMessage, fetchAll } from "~/lib/api";
import { formatDateTime, formatTime, PAYMENT_LABEL, rupiah, STATUS_BADGE, STATUS_LABEL } from "~/lib/format";
import { onAuthError, requireUser } from "~/lib/session";
import type { Order, OrderStatus, PaymentMethod } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/icon";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { EASE_IN, EASE_OUT } from "~/components/page-fade";
import { Pager } from "~/components/pager";
import { SearchInput } from "~/components/search-input";
import { Segmented } from "~/components/segmented";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Spinner } from "~/components/ui/spinner";

const VIEWS = {
  active: { label: "Aktif", status: "pending,preparing,ready" },
  completed: { label: "Selesai", status: "completed" },
  cancelled: { label: "Dibatalkan", status: "cancelled" },
  all: { label: "Semua", status: "" },
} as const;
type View = keyof typeof VIEWS;

// The active view is a board: one column per stage, so the column carries the status
const STAGES = [
  { status: "pending", label: "Belum bayar" },
  { status: "preparing", label: "Disiapkan" },
  { status: "ready", label: "Siap diambil" },
] as const;
type Stage = (typeof STAGES)[number]["status"];

const PER_PAGE = 20;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser();
  const sp = new URL(request.url).searchParams;
  const view = (sp.get("lihat") as View) in VIEWS ? (sp.get("lihat") as View) : "active";
  const query = {
    search: sp.get("cari") ?? "",
    status: VIEWS[view].status,
    paymentMethod: (sp.get("bayar") as PaymentMethod) || "",
    sortBy: "createdAt",
    // The board reads oldest first, like a kitchen ticket rail; history reads newest first
    sortOrder: view === "active" ? "asc" : "desc",
  } as const;
  if (view === "active") {
    // Every active order sits on the board at once, so it isn't paged
    const orders = await fetchAll((page) => api.orders({ ...query, page, perPage: 100 }));
    return { orders, pagination: null, view, fetchedAt: Date.now() };
  }
  const res = await api.orders({ ...query, page: Number(sp.get("hal")) || 1, perPage: PER_PAGE });
  return { orders: res.data, pagination: res.pagination, view, fetchedAt: Date.now() };
}

export default function Orders({ loaderData }: Route.ComponentProps) {
  const { orders, pagination, view, fetchedAt } = loaderData;
  const [sp, setSp] = useSearchParams();
  const revalidator = useRevalidator();
  const [openId, setOpenId] = useState<string | null>(null);

  // 5 s polling while the tab is visible
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && revalidator.state === "idle" && revalidator.revalidate();
    const t = setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    return () => (clearInterval(t), document.removeEventListener("visibilitychange", tick));
  }, [revalidator]);

  // Optimistic: a status the server accepted shows (and moves the card) at once, until the next fetch agrees
  const [applied, setApplied] = useState<Record<string, OrderStatus>>({});
  useEffect(() => setApplied({}), [orders]);
  const shown = orders.map((o) => {
    const status = applied[o.id];
    return status ? { ...o, status, paidAt: o.paidAt ?? (status === "preparing" ? new Date().toISOString() : null) } : o;
  });
  const onMoved = (id: string, status: OrderStatus | null) => {
    if (status) setApplied((a) => ({ ...a, [id]: status }));
    revalidator.revalidate();
  };
  const detail = shown.find((o) => o.id === openId);

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
          Otomatis tiap 5 detik · diperbarui {formatTime(new Date(fetchedAt).toISOString())}
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

      {shown.length === 0 ? (
        <Empty className="rounded-2xl bg-surface shadow-ds-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="my-orders" />
            </EmptyMedia>
            {sp.get("cari") ? (
              <EmptyTitle>Tidak ada yang cocok dengan “{sp.get("cari")}”</EmptyTitle>
            ) : (
              <>
                <EmptyTitle>{view === "active" ? "Belum ada pesanan aktif" : "Belum ada pesanan di sini"}</EmptyTitle>
                <EmptyDescription>
                  {view === "active"
                    ? "Pesanan baru dari meja muncul di sini otomatis. Halaman ini tidak perlu dimuat ulang."
                    : "Ganti tampilan di atas untuk melihat pesanan lain."}
                </EmptyDescription>
              </>
            )}
          </EmptyHeader>
          {sp.get("cari") && (
            <Button variant="outline" size="sm" onClick={() => setParam("cari", "")}>
              Hapus pencarian
            </Button>
          )}
        </Empty>
      ) : view === "active" ? (
        <Board orders={shown} onMoved={onMoved} onOpen={setOpenId} />
      ) : (
        <ul className="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {/* New orders fade in, finished ones fade out, the rest glide to their new places */}
          <AnimatePresence initial={false}>
            {shown.map((o) => (
              <OrderCard key={o.id} order={o} onMoved={(s) => onMoved(o.id, s)} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {pagination && <Pager pagination={pagination} onPage={(p) => setParam("hal", p === 1 ? "" : String(p))} noun="pesanan" />}

      {/* The whole order: notes, payment, invoice and every action, including Langsung selesai */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="gap-0 p-0 max-sm:pt-4 sm:max-w-md">
          {detail && (
            <>
              <DialogTitle className="sr-only">Pesanan {detail.customerName}</DialogTitle>
              <OrderDetail order={detail} onMoved={(s) => onMoved(detail.id, s)} inDialog />
            </>
          )}
        </DialogContent>
      </Dialog>
    </CmsPage>
  );
}

function Board({
  orders,
  onMoved,
  onOpen,
}: {
  orders: Order[];
  onMoved: (id: string, status: OrderStatus | null) => void;
  onOpen: (id: string) => void;
}) {
  const byStage = (s: Stage) => orders.filter((o) => o.status === s);
  // Below xl the columns become tabs; start on the first stage that has work in it
  const [tab, setTab] = useState<Stage>(() => STAGES.find((s) => byStage(s.status).length)?.status ?? "pending");

  return (
    <div className="grid gap-4">
      <Segmented
        label="Tahap"
        className="xl:hidden"
        value={tab}
        onChange={setTab}
        options={STAGES.map((s) => ({ value: s.status, label: `${s.label} · ${byStage(s.status).length}` }))}
      />
      <div className="grid items-start gap-4 xl:grid-cols-3">
        {STAGES.map((stage) => {
          const list = byStage(stage.status);
          return (
            <section
              key={stage.status}
              aria-labelledby={`stage-${stage.status}`}
              className={cn("grid gap-3 rounded-2xl bg-muted/50 p-3 dark:bg-surface/40", stage.status !== tab && "max-xl:hidden")}
            >
              <h2 id={`stage-${stage.status}`} className="flex items-center gap-2 px-1 pt-1 type-label-m">
                {stage.label}
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-surface px-2 type-label-xs text-ink-soft tabular-nums">
                  {list.length}
                </span>
              </h2>
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line-strong py-6 text-center type-body-s text-ink-faint">
                  Tidak ada pesanan
                </p>
              ) : (
                <ul className="grid gap-3">
                  <AnimatePresence initial={false}>
                    {list.map((o) => (
                      <BoardCard key={o.id} order={o} onMoved={(s) => onMoved(o.id, s)} onOpen={() => onOpen(o.id)} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Minutes since the order came in, or the clock time once it's older than an hour. */
function age(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  return mins < 1 ? "baru" : mins < 60 ? `${mins} mnt` : formatTime(createdAt);
}

const cardMotion = {
  layout: "position" as const,
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
  transition: { layout: { duration: 0.3, ease: EASE_OUT } },
};

/** Compact board card: who, what, how much, and the one next step. The rest opens in the detail dialog. */
function BoardCard({ order, onMoved, onOpen }: { order: Order; onMoved: (status: OrderStatus | null) => void; onOpen: () => void }) {
  const { busy, move, setConfirm, dialogs } = useOrderActions(order, onMoved);
  const spin = <Spinner label={false} />;

  return (
    <m.li {...cardMotion} className="relative rounded-xl bg-surface shadow-ds-1 dark:ring-1 dark:ring-border">
      {/* The whole card opens the detail; the action row sits above this layer */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Detail pesanan ${order.customerName}, meja ${order.tableNumber}`}
        className="absolute inset-0 rounded-xl transition-colors duration-[120ms] hover:bg-fill-hover"
      />
      <div className="pointer-events-none relative grid gap-2 px-4 pt-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate type-label-m">
            {order.customerName} · Meja {order.tableNumber}
          </h3>
          <span className="shrink-0 type-body-xs text-ink-faint tabular-nums">{age(order.createdAt)}</span>
        </div>
        <ul className="grid gap-0.5 type-body-s text-ink-soft">
          {order.orderItems.map((it) => (
            <li key={it.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)]">
              <span className="type-label-s text-ink tabular-nums">{it.quantity}×</span>
              <span className="min-w-0">
                {it.menuItems?.name ?? "Menu dihapus"}
                {it.note && (
                  <span className="flex items-start gap-1 type-body-xs text-warning-ink">
                    <Icon name="notes" className="mt-px size-3.5" />
                    {it.note}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="type-label-m tabular-nums">{rupiah(order.total)}</p>
      </div>
      <div className="relative flex flex-wrap items-center gap-x-1 gap-y-2 px-4 pt-3 pb-4">
        {order.status === "pending" && order.paymentMethod === "cash" && (
          <Button size="sm" className="flex-1" onClick={() => setConfirm("pay")} disabled={!!busy}>
            {busy === "preparing" ? spin : <Icon name="cash" />}
            Terima pembayaran
          </Button>
        )}
        {order.status === "pending" && order.paymentMethod === "cashless" && (
          <p className="flex-1 type-body-s text-ink-soft">Menunggu pelanggan membayar online.</p>
        )}
        {order.status === "pending" && (
          <Button
            size="sm"
            variant="ghost"
            className="px-3 text-danger-ink hover:bg-danger-tint-hover"
            onClick={() => setConfirm("cancel")}
            disabled={!!busy}
          >
            Batalkan
          </Button>
        )}
        {order.status === "preparing" && (
          <Button size="sm" className="flex-1" onClick={() => move("ready", "Pelanggan diberi tahu pesanan siap")} disabled={!!busy}>
            {busy === "ready" ? spin : <Icon name="food-ready" />}
            Tandai siap
          </Button>
        )}
        {order.status === "ready" && (
          <Button size="sm" className="flex-1" onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
            {busy === "completed" ? spin : <Icon name="correct" />}
            Sudah diambil
          </Button>
        )}
        {order.paidAt && <InvoiceButton order={order} />}
      </div>
      {dialogs}
    </m.li>
  );
}

/** Status changes, their toasts and the pay/cancel confirmations, shared by the board card and the full card. */
function useOrderActions(order: Order, onMoved: (status: OrderStatus | null) => void) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [confirm, setConfirm] = useState<"pay" | "cancel" | null>(null);

  const move = async (status: Exclude<OrderStatus, "pending">, success: string) => {
    setBusy(status);
    try {
      await api.updateOrderStatus(order.id, status);
      toast.success(success, { description: `${order.invoiceNumber} · ${order.customerName}` });
      onMoved(status);
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Status gagal diubah", { description: errorMessage(e) });
      onMoved(null);
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const dialogs = (
    <>
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
    </>
  );

  return { busy, move, setConfirm, dialogs };
}

/** History views (Selesai, Dibatalkan, Semua) keep the full card. */
function OrderCard({ order, onMoved }: { order: Order; onMoved: (status: OrderStatus | null) => void }) {
  return (
    <m.li
      {...cardMotion}
      className={cn(
        "flex flex-col rounded-2xl bg-surface shadow-ds-1 dark:ring-1 dark:ring-border",
        order.status === "ready" && "ring-2 ring-[var(--ds-status-success)] dark:ring-[var(--ds-status-success)]",
      )}
    >
      <OrderDetail order={order} onMoved={onMoved} />
    </m.li>
  );
}

/** Everything about one order: used as the history card and inside the board's detail dialog. */
function OrderDetail({ order, onMoved, inDialog }: { order: Order; onMoved: (status: OrderStatus | null) => void; inDialog?: boolean }) {
  const { busy, move, setConfirm, dialogs } = useOrderActions(order, onMoved);
  const isNew = Date.now() - new Date(order.createdAt).getTime() < 3 * 60_000 && order.status !== "completed";
  const spin = <Spinner label={false} />;

  return (
    <>
      {/* In the dialog the close button sits top-right, so the header leaves it room */}
      <div className={cn("flex items-start gap-3 px-5 pt-5", inDialog && "pr-14")}>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h2 className="type-label-l">
            {order.customerName} · Meja {order.tableNumber}
          </h2>
          <p className="type-body-xs text-ink-faint tabular-nums">
            {formatDateTime(order.createdAt)} · <span className="whitespace-nowrap">{order.invoiceNumber}</span>
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
              <span aria-hidden>·</span>Sudah dibayar
            </>
          ) : (
            order.status !== "cancelled" && (
              <>
                <span aria-hidden>·</span>
                <span className="text-warning-ink">Belum dibayar</span>
              </>
            )
          )}
        </span>
        <span className="type-label-l tabular-nums">{rupiah(order.total)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 px-5 pt-4 pb-5 empty:pt-0">
        {order.status === "pending" && order.paymentMethod === "cash" && (
          <Button size="sm" className="flex-1" onClick={() => setConfirm("pay")} disabled={!!busy}>
            {busy === "preparing" ? spin : <Icon name="cash" />}
            Terima pembayaran
          </Button>
        )}
        {order.status === "pending" && order.paymentMethod === "cashless" && (
          <p className="flex-1 type-body-s text-ink-soft">Menunggu pelanggan membayar online.</p>
        )}
        {order.status === "pending" && (
          <Button
            size="sm"
            variant="ghost"
            className="px-3 text-danger-ink hover:bg-danger-tint-hover"
            onClick={() => setConfirm("cancel")}
            disabled={!!busy}
          >
            Batalkan
          </Button>
        )}
        {order.status === "preparing" && (
          <>
            <Button size="sm" className="flex-1" onClick={() => move("ready", "Pelanggan diberi tahu pesanan siap")} disabled={!!busy}>
              {busy === "ready" ? spin : <Icon name="food-ready" />}
              Tandai siap
            </Button>
            <Button size="sm" variant="ghost" className="px-3" onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
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
        {order.paidAt && <InvoiceButton order={order} />}
      </div>

      {dialogs}
    </>
  );
}

/** A quiet text button: the download icon alone wasn't clear enough. */
function InvoiceButton({ order }: { order: Order }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-3"
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
      Unduh invoice
    </Button>
  );
}
