import { useEffect, useRef, useState } from "react";
import { Link, redirect, useRevalidator } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/order-status";
import { api, ApiError, errorMessage } from "~/lib/api";
import { CAFE_ADDRESS, CAFE_NAME } from "~/lib/config";
import { formatDateTime, PAYMENT_LABEL, rupiah, STATUS_BADGE, STATUS_LABEL } from "~/lib/format";
import { openSnap, payReturn } from "~/lib/snap";
import { splitProgress } from "~/lib/split";
import { readJson, recentOrders, writeJson } from "~/lib/storage";
import type { Order, OrderStatus } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon, type IconName } from "~/components/icon";
import { MenuThumb } from "~/components/menu-thumb";
import { Frame, InfoRow, InvoiceButton, PartList, usePolling } from "~/components/order-view";
import { RateUsDialog } from "~/components/rate-us-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { EASE_IN, EASE_OUT } from "~/components/page-fade";
import { Spinner } from "~/components/ui/spinner";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const id = new URL(request.url).searchParams.get("order_id");
  if (!id) {
    // "Pesanan saya": open the newest order by its own date. Lists saved by older builds can be
    // out of order, so sort by createdAt and save the list back sorted.
    const ids = recentOrders.list();
    if (!ids.length) return { order: null, missing: false };
    const found = (await Promise.all(ids.map((x) => api.order(x).catch(() => null))))
      .filter((o): o is Order => !!o)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    recentOrders.set(found.map((o) => o.id));
    if (found[0]) throw redirect(`/pesanan?order_id=${found[0].id}`);
    return { order: null, missing: false };
  }
  try {
    const order = await api.order(id);
    recentOrders.add(order.id); // also covers the return from the payment page
    payReturn.take();
    return { order, missing: false };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
      // Back from Midtrans's own page: its order_id is a payment id, so return to where paying started
      const back = payReturn.take();
      if (back) throw redirect(back);
      return { order: null, missing: true };
    }
    throw e;
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const o = loaderData?.order;
  return [{ title: o ? `${o.status === "ready" ? "Pesanan siap! · " : ""}Pesanan ${o.invoiceNumber} · ${CAFE_NAME}` : `Pesanan · ${CAFE_NAME}` }];
}

const FINAL: OrderStatus[] = ["completed", "cancelled"];

export default function OrderStatusPage({ loaderData }: Route.ComponentProps) {
  const { order, missing } = loaderData;
  usePolling(!!order && !FINAL.includes(order.status));
  const sound = useReadySound(order);

  if (!order) {
    return (
      <Frame>
        <Empty className="mx-4 mt-4 rounded-lg bg-surface">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Icon name="my-orders" /></EmptyMedia>
            <EmptyTitle>{missing ? "Pesanan tidak ditemukan" : "Belum ada pesanan"}</EmptyTitle>
            <EmptyDescription>
              {missing
                ? "Tautan pesanan ini tidak valid. Buka dari perangkat yang dipakai saat memesan, atau tanyakan ke kasir."
                : "Pesanan yang Anda buat dari perangkat ini akan muncul di sini."}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link to="/">Lihat menu</Link>
          </Button>
        </Empty>
      </Frame>
    );
  }

  const itemCount = order.orderItems.reduce((n, i) => n + i.quantity, 0);
  const progress = splitProgress(order);
  // A split order gets an invoice per part, from the parts list
  const invoice = order.paidAt && !order.splitMode;

  return (
    <Frame table={order.tableNumber}>
      <section className="grid gap-5 bg-surface px-4 pt-6 pb-5 md:mx-4 md:rounded-2xl">
        <StatusHero order={order} sound={sound} />

        <div className="flex items-baseline justify-between gap-3">
          <h2 className="type-label-m">
            <span className="sr-only">Nomor pesanan </span>
            {order.invoiceNumber}
          </h2>
          <span className="type-body-s text-ink-soft">{formatDateTime(order.createdAt)}</span>
        </div>

        {order.status === "cancelled" ? (
          <div className="flex items-start gap-3 rounded-lg bg-danger-tint p-4 text-danger-ink">
            <Icon name="block" className="mt-0.5 size-5" />
            <p className="type-body-s">
              <span className="block type-label-s">Pesanan dibatalkan</span>
              {order.paymentMethod === "cashless" && !order.paidAt && !order.splitMode
                ? "Pembayaran tidak selesai sebelum batas waktu. Silakan pesan lagi."
                : "Pesanan ini dibatalkan oleh kafe. Tanyakan ke kasir bila ada pertanyaan."}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            <Progress status={order.status} paymentMethod={order.splitMode ? "cashless" : order.paymentMethod} />
            {order.splitMode && order.status === "pending" && (
              <p className="text-center type-label-xs text-warning-ink tabular-nums">
                {progress.paid} dari {progress.count} sudah bayar
              </p>
            )}
          </div>
        )}
      </section>

      <section className="grid bg-surface px-4 md:mx-4 md:rounded-2xl" aria-label="Ringkasan">
        <InfoRow icon="location" title={CAFE_NAME} sub={CAFE_ADDRESS || `Meja ${order.tableNumber}`} />
        {order.splitMode ? (
          <InfoRow
            icon="group"
            title={`Pisah ${progress.count} bagian${order.splitMode === "even" ? " · dibagi rata" : ""}`}
            sub={
              order.paidAt
                ? `Semua sudah dibayar · ${formatDateTime(order.paidAt)}`
                : `${progress.paid} dari ${progress.count} sudah bayar · sisa ${rupiah(progress.left)}`
            }
          />
        ) : (
          <InfoRow
            icon={order.paymentMethod === "cash" ? "cash" : "wallet"}
            title={PAYMENT_LABEL[order.paymentMethod]}
            sub={order.paidAt ? `Sudah dibayar · ${formatDateTime(order.paidAt)}` : "Belum dibayar"}
          />
        )}
        <InfoRow icon="bill" title={`${itemCount} item`}>
          <dl className="mt-2 grid gap-1 type-body-s">
            <div className="flex justify-between type-label-m">
              <dt>Total</dt>
              <dd className="tabular-nums">{rupiah(order.total)}</dd>
            </div>
          </dl>
        </InfoRow>
      </section>

      {order.splitMode && (
        <section className="grid bg-surface px-4 pt-4 md:mx-4 md:rounded-2xl" aria-labelledby="parts-title">
          <h2 id="parts-title" className="type-label-m">
            Bagian
          </h2>
          <PartList order={order} share />
        </section>
      )}

      <section className="bg-surface px-4 md:mx-4 md:rounded-2xl" aria-labelledby="items-title">
        <h2 id="items-title" className="sr-only">Daftar item</h2>
        <ul>
          {order.orderItems.map((it) => (
            <li key={it.id} className="flex gap-3 border-b py-4 last:border-b-0">
              <MenuThumb src={it.menuItems?.imageUrl} alt="" className="size-16 rounded-md" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="type-label-s">
                  <span className="tabular-nums">{it.quantity}×</span> {it.menuItems?.name ?? "Menu dihapus"}
                </span>
                {it.note && (
                  <span className="type-body-s text-ink-soft">
                    <span className="type-label-xs text-ink">Catatan:</span> {it.note}
                  </span>
                )}
              </div>
              <span className="type-label-s tabular-nums">{rupiah(it.priceAtOrder * it.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 px-4 sm:grid-cols-2">
        {invoice && <InvoiceButton order={order} />}
        <Button asChild variant={invoice ? "outline" : "default"} className={cn(!invoice && "sm:col-span-2")}>
          <Link to={`/?meja=${order.tableNumber}`}>
            <Icon name="food-menu" />
            Pesan lagi
          </Link>
        </Button>
      </div>

      <OtherOrders currentId={order.id} />

      {order.status === "completed" && <RateUsDialog customerName={order.customerName} />}
    </Frame>
  );
}

const HERO: Record<OrderStatus, { icon: IconName; tone: string }> = {
  pending: { icon: "time-left", tone: "bg-warning-tint text-warning-ink" },
  preparing: { icon: "freshly-made", tone: "bg-info-tint text-info-ink" },
  ready: { icon: "food-ready", tone: "bg-success-tint text-success-ink" },
  completed: { icon: "order-completion", tone: "bg-muted text-ink-soft" },
  cancelled: { icon: "block", tone: "bg-danger-tint text-danger-ink" },
};

function StatusHero({ order, sound }: { order: Order; sound: ReturnType<typeof useReadySound> }) {
  const { icon, tone } = HERO[order.status];
  const pending = order.status === "pending";
  const cashPending = pending && !order.splitMode && order.paymentMethod === "cash";
  const cashlessPending = pending && !order.splitMode && order.paymentMethod === "cashless";

  return (
    <div className="grid justify-items-center gap-3 text-center" aria-live="polite">
      <span className={cn("grid size-20 place-items-center rounded-full transition-colors duration-[240ms] ease-out", tone)}>
        {/* New status: the old icon fades out, the new one settles in from 85% */}
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={icon}
            className="grid"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.24, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE_IN } }}
          >
            <Icon name={icon} className="size-9" />
          </m.span>
        </AnimatePresence>
      </span>

      {cashPending && (
        <>
          <p className="type-label-l">Silakan bayar di kasir</p>
          <p className="max-w-xs type-body-s text-ink-soft">
            Sebutkan nomor pesanan di bawah dan bayar{" "}
            <span className="type-label-s whitespace-nowrap text-ink tabular-nums">{rupiah(order.total)}</span>. Setelah
            kasir menerima pembayaran, pesanan mulai dibuat. Anda bisa kembali ke meja dan memantau status di halaman ini.
          </p>
        </>
      )}

      {cashlessPending && (
        <>
          <p className="type-label-l">Menunggu pembayaran</p>
          <p className="max-w-xs type-body-s text-ink-soft">
            Pesanan dibuat setelah pembayaran diterima. Halaman ini diperbarui otomatis.
          </p>
          {(order.snapToken || order.redirectUrl) && <ContinuePayment order={order} />}
        </>
      )}

      {pending && order.splitMode && (
        <>
          <p className="type-label-l">Menunggu semua bagian dibayar</p>
          <p className="max-w-xs type-body-s text-ink-soft">
            Pesanan mulai dibuat setelah {order.orderParts.length} bagian lunas. Bagikan tautan bagian ke teman Anda dari
            daftar di bawah.
          </p>
        </>
      )}

      {order.status === "preparing" && (
        <>
          <p className="type-label-l">Pesanan sedang disiapkan</p>
          <p className="max-w-xs type-body-s text-ink-soft">
            Terima kasih, {order.customerName}. Kami akan membunyikan notifikasi saat pesanan siap diambil, jadi biarkan
            halaman ini terbuka.
          </p>
          {sound.blocked && <SoundPrompt onEnable={sound.enable} />}
        </>
      )}

      {order.status === "ready" && (
        <div className="grid w-full justify-items-center gap-3 rounded-2xl bg-success-tint px-4 py-5 text-success-ink">
          <p className="type-label-l">Pesanan siap diambil!</p>
          <p className="max-w-xs type-body-s text-ink">
            Silakan ambil pesanan Anda di konter dengan menyebutkan nama <b>{order.customerName}</b> atau nomor pesanan.
          </p>
          {sound.blocked && <SoundPrompt onEnable={sound.enable} />}
        </div>
      )}

      {order.status === "completed" && (
        <>
          <p className="type-label-l">Pesanan selesai</p>
          <p className="max-w-xs type-body-s text-ink-soft">Terima kasih, {order.customerName}. Selamat menikmati!</p>
        </>
      )}

      {order.status === "cancelled" && <p className="type-label-l">Pesanan dibatalkan</p>}
    </div>
  );
}

/** Reopens the Midtrans popup for an unpaid online order, then refreshes from Midtrans. */
function ContinuePayment({ order }: { order: Order }) {
  const { revalidate } = useRevalidator();
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    try {
      const result = await openSnap(order.snapToken, order.redirectUrl, `/pesanan?order_id=${order.id}`);
      if (result === "redirected") return;
      await api.checkOrderPayment(order.id).catch(() => null);
      revalidate();
    } catch (e) {
      toast.error("Pembayaran belum bisa dibuka", { description: errorMessage(e) });
    }
    setBusy(false);
  };
  return (
    <Button onClick={pay} disabled={busy}>
      {busy ? <Spinner label={false} /> : <Icon name="wallet" />}
      Lanjutkan pembayaran
    </Button>
  );
}

function SoundPrompt({ onEnable }: { onEnable: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onEnable}>
      <Icon name="volume-up" />
      Aktifkan suara notifikasi
    </Button>
  );
}

function Progress({ status, paymentMethod }: { status: OrderStatus; paymentMethod: Order["paymentMethod"] }) {
  const steps = [
    paymentMethod === "cash" ? "Bayar di kasir" : "Belum bayar",
    "Disiapkan",
    "Siap diambil",
    "Selesai",
  ];
  const current = ["pending", "preparing", "ready", "completed"].indexOf(status);
  // How many steps are done; the circles follow 400ms later, once the line has filled
  const reach = status === "completed" ? 4 : current;
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reach);
  useEffect(() => {
    if (reduce) return setShown(reach);
    const t = setTimeout(() => setShown(reach), 400);
    return () => clearTimeout(t);
  }, [reach, reduce]);

  return (
    <ol className="grid grid-cols-4" aria-label="Status pesanan">
      {steps.map((label, i) => {
        const done = i < shown;
        const active = i === shown;
        return (
          <li
            key={label}
            className="relative grid justify-items-center gap-2 text-center"
            aria-current={active ? "step" : undefined}
          >
            {i > 0 && (
              <span aria-hidden className="absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 bg-line-strong">
                <span
                  className={cn(
                    "block size-full origin-left bg-[var(--ds-selected)] transition-transform duration-[400ms] ease-out",
                    i <= reach ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
            )}
            <span
              className={cn(
                // z-10: the next step's connector is a later sibling and would paint over this circle
                "relative z-10 grid size-8 place-items-center rounded-full type-label-s",
                done && "bg-surface text-[var(--ds-selected)]", // the check is a cutout; the surface keeps the line from showing through
                active && "border-2 border-[var(--ds-selected)] bg-surface text-ink",
                !done && !active && "bg-muted text-ink-faint",
              )}
            >
              {done ? <Icon name="correct" className="size-8" /> : i + 1}
            </span>
            <span className={cn("px-0.5 type-label-xs leading-tight", done || active ? "text-ink" : "text-ink-faint")}>
              {label}
              <span className="sr-only">{done ? " (selesai)" : active ? " (sekarang)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OtherOrders({ currentId }: { currentId: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    const ids = recentOrders.list().filter((id) => id !== currentId).slice(0, 5);
    if (!ids.length) return setOrders([]);
    Promise.all(ids.map((id) => api.order(id).catch(() => null))).then((r) =>
      // Newest first by the order's own time, whatever order this device stored them in
      setOrders(r.filter((o): o is Order => !!o).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    );
  }, [currentId]);

  if (!orders?.length) return null;
  return (
    <section className="grid gap-2 px-4 pt-3" aria-labelledby="other-orders">
      <h2 id="other-orders" className="type-label-m">
        Pesanan lain dari perangkat ini
      </h2>
      <ul className="grid gap-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              to={`/pesanan?order_id=${o.id}`}
              className="flex items-center gap-3 rounded-lg bg-surface p-3 text-ink no-underline transition-colors hover:bg-fill-hover"
            >
              <span className="grid min-w-0 flex-1">
                <span className="type-label-s">{o.invoiceNumber}</span>
                <span className="type-body-xs text-ink-soft">
                  {formatDateTime(o.createdAt)} · {rupiah(o.total)}
                </span>
              </span>
              <Badge variant={STATUS_BADGE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
              <Icon name="next" className="text-ink-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const NOTIFIED_KEY = "ready-notified";

/**
 * Plays alarm.mp3 once per order when it turns ready. Browsers block sound until the visitor has
 * touched the page, so the first tap anywhere unlocks it; if it is still blocked, `blocked` asks
 * for one tap.
 */
function useReadySound(order: Order | null) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    audio.current = new Audio("/sounds/alarm.mp3");
    audio.current.preload = "auto";
    const unlock = () => {
      const a = audio.current;
      if (!a) return;
      a.muted = true;
      a.play()
        .then(() => (a.pause(), (a.currentTime = 0), (a.muted = false), setBlocked(false)))
        .catch(() => (a.muted = false));
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const status = order?.status;
  const id = order?.id;
  useEffect(() => {
    if (!id || !status) return;
    if (status === "preparing") {
      // Probe whether sound is allowed yet, so the prompt shows before the order is ready
      setBlocked(!navigator.userActivation?.hasBeenActive);
      return;
    }
    if (status !== "ready") return;
    const notified = readJson<string[]>(NOTIFIED_KEY, []);
    if (notified.includes(id)) return;
    writeJson(NOTIFIED_KEY, [id, ...notified].slice(0, 20));
    navigator.vibrate?.([300, 150, 300]);
    audio.current?.play().then(
      () => setBlocked(false),
      () => setBlocked(true),
    );
  }, [id, status]);

  const enable = () => {
    const a = audio.current;
    if (!a) return;
    const unlockOnly = status !== "ready"; // preparing: this tap only unlocks sound for later
    a.currentTime = 0;
    a.muted = unlockOnly;
    a.play().then(
      () => {
        setBlocked(false);
        if (unlockOnly) (a.pause(), (a.muted = false));
      },
      () => ((a.muted = false), setBlocked(true)),
    );
  };

  return { blocked, enable };
}
