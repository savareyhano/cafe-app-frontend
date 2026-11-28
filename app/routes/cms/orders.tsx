import { useEffect, useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";

import type { Route } from "./+types/orders";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api, errorMessage, fetchAll } from "~/lib/api";
import { formatDateTime, formatTime, PAYMENT_LABEL, rupiah, STATUS_BADGE, STATUS_LABEL } from "~/lib/format";
import { onAuthError, requireUser } from "~/lib/session";
import { partName, partSummary, splitProgress } from "~/lib/split";
import type { Order, OrderPart, OrderStatus, PaymentMethod } from "~/lib/types";
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
        // Same card as the board; only "Semua" mixes statuses, so only it shows the status pill
        <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {shown.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onMoved={(s) => onMoved(o.id, s)}
                onOpen={() => setOpenId(o.id)}
                showStatus={view === "all"}
              />
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
                      <OrderCard key={o.id} order={o} onMoved={(s) => onMoved(o.id, s)} onOpen={() => onOpen(o.id)} />
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

const ACTIVE: OrderStatus[] = ["pending", "preparing", "ready"];

/**
 * The one order card, in every view: who, when, what, how much, and the one next step. Everything
 * else (payment, Langsung selesai) opens in the detail dialog. Actions sit on one row when the card
 * is wide enough; otherwise the main action takes the full width and the rest go below it.
 */
function OrderCard({
  order,
  onMoved,
  onOpen,
  showStatus = false,
}: {
  order: Order;
  onMoved: (status: OrderStatus | null) => void;
  onOpen: () => void;
  showStatus?: boolean;
}) {
  const { busy, move, setConfirm, setPart, dialogs } = useOrderActions(order, onMoved);
  const spin = <Spinner label={false} />;
  const wide = "@min-[20rem]:flex-1";
  const progress = splitProgress(order);

  return (
    <m.li {...cardMotion} className="@container relative rounded-xl bg-surface shadow-ds-1 dark:ring-1 dark:ring-border">
      {/* The whole card opens the detail; the action row sits above this layer */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Detail pesanan ${order.customerName}, meja ${order.tableNumber}`}
        className="absolute inset-0 rounded-xl transition-colors duration-[120ms] hover:bg-fill-hover"
      />
      <div className="pointer-events-none relative grid gap-2 px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="grid min-w-0">
            <h3 className="truncate type-label-m">
              {order.customerName} · Meja {order.tableNumber}
            </h3>
            <p className="type-body-xs text-ink-faint tabular-nums">
              {formatDateTime(order.createdAt)} · <span className="whitespace-nowrap">{order.invoiceNumber}</span>
            </p>
          </div>
          {showStatus ? (
            <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          ) : (
            ACTIVE.includes(order.status) && (
              <span className="shrink-0 type-body-xs text-ink-faint tabular-nums">{age(order.createdAt)}</span>
            )
          )}
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
        {order.splitMode && <CardParts order={order} busy={busy} onTake={setPart} />}
      </div>
      <div className="relative grid gap-1 px-4 pb-4 empty:hidden @min-[20rem]:flex @min-[20rem]:items-center">
        {order.status === "pending" && order.splitMode && (
          <p className={cn("type-body-s text-ink-soft tabular-nums", wide)}>
            {progress.paid} dari {progress.count} lunas · sisa <span className="type-label-s text-ink">{rupiah(progress.left)}</span>
          </p>
        )}
        {order.status === "pending" && !order.splitMode && order.paymentMethod === "cash" && (
          <Button size="sm" className={wide} onClick={() => setConfirm("pay")} disabled={!!busy}>
            {busy === "preparing" ? spin : <Icon name="cash" />}
            Terima pembayaran
          </Button>
        )}
        {order.status === "pending" && !order.splitMode && order.paymentMethod === "cashless" && (
          <p className={cn("type-body-s text-ink-soft", wide)}>Menunggu pelanggan membayar online.</p>
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
          <Button size="sm" className={wide} onClick={() => move("ready", "Pelanggan diberi tahu pesanan siap")} disabled={!!busy}>
            {busy === "ready" ? spin : <Icon name="food-ready" />}
            Tandai siap
          </Button>
        )}
        {order.status === "ready" && (
          <Button size="sm" className={wide} onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
            {busy === "completed" ? spin : <Icon name="correct" />}
            Sudah diambil
          </Button>
        )}
        {order.paidAt && !order.splitMode && <InvoiceButton order={order} />}
      </div>
      {dialogs}
    </m.li>
  );
}

/** Status changes, their toasts and the pay/cancel confirmations, shared by the board card and the full card. */
function useOrderActions(order: Order, onMoved: (status: OrderStatus | null) => void) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<OrderStatus | "part" | null>(null);
  const [confirm, setConfirm] = useState<"pay" | "cancel" | null>(null);
  const [part, setPart] = useState<OrderPart | null>(null);
  const progress = splitProgress(order);
  const paidParts = order.orderParts.filter((p) => p.paidAt);
  const refund = paidParts.reduce((n, p) => n + p.amount, 0);

  const move = async (status: Exclude<OrderStatus, "pending">, success: string) => {
    setBusy(status);
    try {
      const res = await api.updateOrderStatus(order.id, status);
      toast.success(success, {
        description: res.data?.paidPartCount
          ? `${res.data.paidPartCount} bagian sudah dibayar · ${rupiah(res.data.refundAmount)} perlu dikembalikan`
          : `${order.invoiceNumber} · ${order.customerName}`,
      });
      onMoved(status);
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Status gagal diubah", { description: errorMessage(e) });
      onMoved(null);
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  // Cash for one part of a split order; the last one sends the order to the kitchen
  const takePart = async (p: OrderPart) => {
    const last = progress.paid + 1 === progress.count;
    setBusy("part");
    try {
      await api.markPartPaid(p.id);
      toast.success(last ? "Semua bagian lunas, pesanan disiapkan" : `Pembayaran ${partName(p)} diterima`, {
        description: `${progress.paid + 1} dari ${progress.count} lunas · ${order.invoiceNumber}`,
      });
      onMoved(last ? "preparing" : null);
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Pembayaran gagal dicatat", { description: errorMessage(e) });
      onMoved(null);
    } finally {
      setBusy(null);
      setPart(null);
    }
  };

  const dialogs = (
    <>
      <ConfirmDialog
        open={!!part}
        onOpenChange={(o) => !o && setPart(null)}
        title={part ? `Terima tunai dari ${partName(part)}?` : ""}
        description={
          part &&
          `Bagian ${part.no} dari ${progress.count} · ${part.invoiceNumber} · ${rupiah(part.amount)}. ${
            progress.paid + 1 === progress.count
              ? "Ini bagian terakhir, jadi pesanan langsung masuk ke dapur."
              : `Pesanan mulai dibuat setelah semua bagian lunas. Masih ada ${progress.count - progress.paid - 1} bagian lagi setelah ini.`
          }`
        }
        confirmLabel={part ? `Terima ${rupiah(part.amount)}` : ""}
        cancelLabel="Kembali"
        busy={busy === "part"}
        onConfirm={() => part && takePart(part)}
      />
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
        description={
          <>
            {order.invoiceNumber} atas nama {order.customerName}. Pesanan yang dibatalkan tidak bisa diaktifkan lagi.
            {paidParts.length > 0 && (
              <span className="mt-3 flex items-start gap-2 rounded-lg bg-danger-tint p-3 text-left text-danger-ink">
                <Icon name="error" className="mt-0.5 shrink-0" />
                <span>
                  <span className="type-label-s">
                    {paidParts.length} bagian sudah dibayar · {rupiah(refund)} perlu dikembalikan.
                  </span>{" "}
                  {paidParts.map((p) => `${partName(p)} (${p.paymentMethod === "cash" ? "tunai" : "non-tunai"})`).join(", ")}.
                  Kembalikan tunai di kasir, atau lewat dashboard Midtrans untuk pembayaran non-tunai.
                </span>
              </span>
            )}
          </>
        }
        confirmLabel="Batalkan pesanan"
        cancelLabel="Jangan batalkan"
        destructive
        busy={busy === "cancelled"}
        onConfirm={() => move("cancelled", "Pesanan dibatalkan")}
      />
    </>
  );

  return { busy, move, setConfirm, setPart, dialogs };
}

/** Everything about one order, shown in the detail dialog when a card is clicked. */
function OrderDetail({ order, onMoved, inDialog }: { order: Order; onMoved: (status: OrderStatus | null) => void; inDialog?: boolean }) {
  const { busy, move, setConfirm, setPart, dialogs } = useOrderActions(order, onMoved);
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

      {order.splitMode && <DetailParts order={order} busy={busy} onTake={setPart} />}

      <div className={cn("flex items-center justify-between gap-3 px-5 pt-3", order.splitMode && "hidden")}>
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

      {/* Main action on its own full row, the quieter ones together below it, so nothing wraps alone */}
      <div className="grid gap-1 px-5 pt-4 pb-5 empty:hidden">
        {order.status === "pending" && !order.splitMode && order.paymentMethod === "cash" && (
          <Button size="sm" onClick={() => setConfirm("pay")} disabled={!!busy}>
            {busy === "preparing" ? spin : <Icon name="cash" />}
            Terima pembayaran
          </Button>
        )}
        {order.status === "pending" && !order.splitMode && order.paymentMethod === "cashless" && (
          <p className="type-body-s text-ink-soft">Menunggu pelanggan membayar online.</p>
        )}
        {order.status === "preparing" && (
          <Button size="sm" onClick={() => move("ready", "Pelanggan diberi tahu pesanan siap")} disabled={!!busy}>
            {busy === "ready" ? spin : <Icon name="food-ready" />}
            Tandai siap
          </Button>
        )}
        {order.status === "ready" && (
          <Button size="sm" onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
            {busy === "completed" ? spin : <Icon name="correct" />}
            Sudah diambil
          </Button>
        )}
        <div className="flex flex-wrap justify-center gap-1 empty:hidden">
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
            <Button size="sm" variant="ghost" className="px-3" onClick={() => move("completed", "Pesanan selesai")} disabled={!!busy}>
              {busy === "completed" && spin}
              Langsung selesai
            </Button>
          )}
          {order.paidAt && !order.splitMode && <InvoiceButton order={order} />}
        </div>
      </div>

      {dialogs}
    </>
  );
}

/** A quiet text button: the download icon alone wasn't clear enough. */
function InvoiceButton({ order, part }: { order: Order; part?: OrderPart }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-3"
      aria-label={`Unduh invoice ${part?.invoiceNumber ?? order.invoiceNumber}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await (await import("~/lib/invoice")).downloadInvoice(order, part);
        } catch (e) {
          toast.error("Invoice gagal diunduh", { description: errorMessage(e) });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner label={false} /> : <Icon name="downloads" />}
      {part ? "Invoice" : "Unduh invoice"}
    </Button>
  );
}

/** A part's payment state in words and an icon, never by color alone. */
function partState(p: OrderPart): { text: string; icon: "correct" | "cash" | "time-left"; tone: string } {
  if (p.paidAt)
    return { text: `Lunas · ${p.paymentMethod ? PAYMENT_LABEL[p.paymentMethod] : "Dibayar"}`, icon: "correct", tone: "text-success-ink" };
  if (p.paymentMethod === "cash") return { text: "Bayar tunai di kasir", icon: "cash", tone: "text-info-ink" };
  if (p.paymentMethod === "cashless") return { text: "Menunggu bayar online", icon: "time-left", tone: "text-warning-ink" };
  return { text: "Belum pilih cara bayar", icon: "time-left", tone: "text-warning-ink" };
}

/**
 * Who pays what on the card: each person's amount and state, the items they cover, and a full-width
 * "Terima" for anyone paying cash at the counter, so the cashier never has to open the dialog for it.
 */
function CardParts({ order, busy, onTake }: { order: Order; busy: string | null; onTake: (p: OrderPart) => void }) {
  return (
    <div className="mt-1 grid border-t pt-2">
      <p className="type-label-xs text-ink-soft">
        {order.splitMode === "even" ? `Dibagi rata ${order.orderParts.length}` : `Pisah ${order.orderParts.length} bagian`}
      </p>
      <ul className="grid">
        {order.orderParts.map((p) => {
          const st = partState(p);
          const take = order.status === "pending" && !p.paidAt && p.paymentMethod !== "cashless";
          return (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 border-t py-2 first:border-t-0 first:pt-1 last:pb-0"
            >
              <span className="truncate type-label-s">{partName(p)}</span>
              <span className="type-label-s tabular-nums">{rupiah(p.amount)}</span>
              <span className={cn("col-span-2 flex items-center gap-1 type-label-xs", st.tone)}>
                <Icon name={st.icon} className="size-3.5" />
                {st.text}
              </span>
              {order.splitMode === "item" && <span className="col-span-2 type-body-xs text-ink-faint">{partSummary(order, p)}</span>}
              {take && (
                <Button
                  size="sm"
                  className="pointer-events-auto relative col-span-2 mt-1.5"
                  onClick={() => onTake(p)}
                  disabled={!!busy}
                >
                  <Icon name="cash" />
                  Terima {rupiah(p.amount)}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The detail dialog's payment section for a split order: every part with its invoice number and its action. */
function DetailParts({ order, busy, onTake }: { order: Order; busy: string | null; onTake: (p: OrderPart) => void }) {
  const progress = splitProgress(order);
  return (
    <section className="grid gap-2 px-5 pt-3" aria-label="Pembayaran per bagian">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="type-label-s">
          Pembayaran · {order.splitMode === "even" ? `Dibagi rata ${progress.count}` : `Pisah ${progress.count} bagian`}
        </h3>
        <span className="type-label-l tabular-nums">{rupiah(order.total)}</span>
      </div>
      <ul className="grid rounded-xl ring-1 ring-border">
        {order.orderParts.map((p) => {
          const st = partState(p);
          return (
            <li key={p.id} className="flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0">
              <span className="grid min-w-0 flex-1">
                <span className="truncate type-label-s">{partName(p)}</span>
                <span className={cn("flex items-center gap-1 type-body-xs", st.tone)}>
                  <Icon name={st.icon} className="size-3.5" />
                  {p.paidAt ? `${st.text} · ${formatTime(p.paidAt)}` : st.text}
                </span>
                <span className="type-body-xs text-ink-faint tabular-nums">{p.invoiceNumber}</span>
              </span>
              <span className="type-label-s tabular-nums">{rupiah(p.amount)}</span>
              {p.paidAt ? (
                <InvoiceButton order={order} part={p} />
              ) : (
                order.status === "pending" && (
                  <Button
                    size="sm"
                    variant={p.paymentMethod === "cashless" ? "outline" : "default"}
                    onClick={() => onTake(p)}
                    disabled={!!busy}
                  >
                    <Icon name="cash" />
                    Terima
                  </Button>
                )
              )}
            </li>
          );
        })}
      </ul>
      {order.status === "pending" && (
        <p className="type-body-xs text-ink-soft tabular-nums">
          {progress.paid} dari {progress.count} lunas · sisa {rupiah(progress.left)}. Pesanan masuk ke dapur setelah semua
          bagian lunas.
        </p>
      )}
    </section>
  );
}

