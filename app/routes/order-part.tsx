import { useState } from "react";
import { Link, useRevalidator } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/order-part";
import { api, ApiError, errorMessage } from "~/lib/api";
import { CAFE_NAME } from "~/lib/config";
import { formatTime, PAYMENT_LABEL, paymentTypeLabel, rupiah, STATUS_LABEL } from "~/lib/format";
import { openSnap } from "~/lib/snap";
import { partPath, partSummary, partTitle, splitProgress } from "~/lib/split";
import { recentOrders } from "~/lib/storage";
import type { Order, OrderPart } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/icon";
import { Frame, InvoiceButton, PartList, usePolling } from "~/components/order-view";
import { Button } from "~/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return { view: null };
  try {
    const view = await api.orderPart(id);
    recentOrders.add(view.order.id); // a friend's phone can follow the order too
    return { view };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return { view: null };
    throw e;
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const part = loaderData?.view?.part;
  return [{ title: part ? `${partTitle(part)} · ${CAFE_NAME}` : `Bagian · ${CAFE_NAME}` }];
}

/**
 * One person's share of a split order: their amount and how to pay it, who else has paid, and the
 * whole order folded away. Friends get here from the link or QR the orderer shares.
 */
export default function OrderPartPage({ loaderData }: Route.ComponentProps) {
  const { view } = loaderData;
  usePolling(!!view && !["completed", "cancelled"].includes(view.order.status));

  if (!view) {
    return (
      <Frame title="Bagian">
        <Empty className="mx-4 mt-4 rounded-lg bg-surface">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="group" />
            </EmptyMedia>
            <EmptyTitle>Bagian tidak ditemukan</EmptyTitle>
            <EmptyDescription>Tautan ini tidak valid. Minta tautan baru ke teman yang memesan, atau tanyakan ke kasir.</EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link to="/">Lihat menu</Link>
          </Button>
        </Empty>
      </Frame>
    );
  }

  const { part, order } = view;
  const progress = splitProgress(order);

  return (
    <Frame table={order.tableNumber} title={partTitle(part)}>
      <section className="grid justify-items-center gap-3 bg-surface px-4 pt-6 pb-5 text-center md:mx-4 md:rounded-2xl" aria-live="polite">
        <PartHero part={part} order={order} />
      </section>

      <section className="grid bg-surface px-4 pt-4 md:mx-4 md:rounded-2xl" aria-labelledby="group-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="group-title" className="type-label-m">
            Pembayaran grup
          </h2>
          <span className="type-body-s text-ink-soft tabular-nums">
            {progress.paid} dari {progress.count} sudah bayar
          </span>
        </div>
        <PartList order={order} current={part.id} />
      </section>

      <details className="group bg-surface px-4 md:mx-4 md:rounded-2xl">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="grid flex-1">
            <span className="type-label-s">Seluruh pesanan</span>
            <span className="type-body-xs text-ink-soft tabular-nums">
              {order.invoiceNumber} · {order.orderItems.reduce((n, i) => n + i.quantity, 0)} item · {rupiah(order.total)}
            </span>
          </span>
          <Icon name="expand-more" className="size-5 text-ink-faint transition-transform group-open:rotate-180" />
        </summary>
        <ul className="border-t pb-2">
          {order.orderItems.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 py-2 type-body-s">
              <span>
                <span className="tabular-nums">{it.quantity}×</span> {it.menuItems?.name ?? "Menu dihapus"}
              </span>
              <span className="text-ink-soft tabular-nums">{rupiah(it.priceAtOrder * it.quantity)}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="px-4">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/pesanan?order_id=${order.id}`}>Lihat status pesanan</Link>
        </Button>
      </div>
    </Frame>
  );
}

function PartHero({ part, order }: { part: OrderPart; order: Order }) {
  const { revalidate } = useRevalidator();
  const [busy, setBusy] = useState<"" | "online" | "cash">("");
  const progress = splitProgress(order);

  const run = async (kind: "online" | "cash", fn: () => Promise<unknown>) => {
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      toast.error(kind === "online" ? "Pembayaran belum bisa dibuka" : "Cara bayar gagal diubah", {
        description: errorMessage(e),
      });
    }
    revalidate();
    setBusy("");
  };

  const payOnline = () =>
    run("online", async () => {
      if (part.paymentMethod === "cash") await api.setPartMethod(part.id, "cashless");
      const { part: ready } = await api.payPart(part.id);
      if (ready.paidAt) return;
      const result = await openSnap(ready.snapToken, ready.redirectUrl, partPath(part.id));
      if (result !== "redirected") await api.checkPartPayment(part.id).catch(() => null);
    });
  const payCash = () => run("cash", () => api.setPartMethod(part.id, "cash"));

  if (order.status === "cancelled") {
    return (
      <div className="flex w-full items-start gap-3 rounded-lg bg-danger-tint p-4 text-left text-danger-ink">
        <Icon name="block" className="mt-0.5 size-5" />
        <p className="type-body-s">
          <span className="block type-label-s">Pesanan dibatalkan</span>
          {!part.paidAt
            ? "Pesanan ini dibatalkan oleh kafe. Bagian ini tidak perlu dibayar."
            : part.refundedAt
              ? `Dana ${rupiah(part.amount)} dikembalikan otomatis ke ${paymentTypeLabel(part.paymentType)} Anda. Waktu masuknya tergantung penyedia pembayaran.`
              : `Kafe akan mengembalikan dana ${rupiah(part.amount)} Anda. Tanyakan ke kasir.`}
        </p>
      </div>
    );
  }

  if (part.paidAt) {
    const left = progress.count - progress.paid;
    return (
      <>
        <Ring tone="bg-success-tint text-success-ink" icon="correct" />
        <p className="type-label-l">Bagian ini sudah dibayar</p>
        <p className="max-w-xs type-body-s text-ink-soft">
          {part.paymentMethod ? PAYMENT_LABEL[part.paymentMethod] : "Dibayar"} · {formatTime(part.paidAt)} ·{" "}
          <span className="tabular-nums">{rupiah(part.amount)}</span>.{" "}
          {order.status === "pending"
            ? `Pesanan mulai dibuat setelah ${left} bagian lagi lunas. Halaman ini diperbarui otomatis.`
            : `Status pesanan: ${STATUS_LABEL[order.status]}.`}
        </p>
        <InvoiceButton order={order} part={part} className="w-full" />
      </>
    );
  }

  if (part.paymentMethod === "cash") {
    return (
      <>
        <Ring tone="bg-warning-tint text-warning-ink" icon="cash" />
        <p className="type-label-l">Silakan bayar di kasir</p>
        <p className="max-w-xs type-body-s text-ink-soft">
          Sebutkan nomor <span className="type-label-s whitespace-nowrap text-ink">{part.invoiceNumber}</span> dan bayar{" "}
          <span className="type-label-s whitespace-nowrap text-ink tabular-nums">{rupiah(part.amount)}</span>. Pesanan
          mulai dibuat setelah semua bagian lunas.
        </p>
        <Button variant="ghost" onClick={payOnline} disabled={!!busy}>
          {busy === "online" ? <Spinner label={false} /> : <Icon name="wallet" />}
          Ganti ke bayar online
        </Button>
      </>
    );
  }

  return (
    <>
      <p className="type-body-s text-ink-soft">
        <span className="whitespace-nowrap">{part.invoiceNumber}</span> · dari pesanan {order.customerName}
      </p>
      <p className="type-display-l tabular-nums">{rupiah(part.amount)}</p>
      <p className="max-w-xs type-body-s text-ink-soft">{partSummary(order, part)}</p>
      <div className={cn("mt-2 grid w-full gap-2")}>
        <Button size="lg" onClick={payOnline} disabled={!!busy}>
          {busy === "online" ? <Spinner label={false} /> : <Icon name="wallet" />}
          Bayar {rupiah(part.amount)} online
        </Button>
        <Button size="lg" variant="outline" onClick={payCash} disabled={!!busy}>
          {busy === "cash" ? <Spinner label={false} /> : <Icon name="cash" />}
          Bayar tunai di kasir
        </Button>
      </div>
    </>
  );
}

function Ring({ tone, icon }: { tone: string; icon: "correct" | "cash" }) {
  return (
    <span className={cn("grid size-20 place-items-center rounded-full", tone)}>
      <Icon name={icon} className="size-9" />
    </span>
  );
}
