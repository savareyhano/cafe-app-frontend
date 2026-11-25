import { useRef, useState } from "react";
import { Link, useRevalidator, useSearchParams } from "react-router";

import type { Route } from "./+types/dashboard";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api } from "~/lib/api";
import { formatTime, PAYMENT_LABEL, rupiah, STATUS_BADGE, STATUS_LABEL, TYPE_LABEL } from "~/lib/format";
import { ADMIN, requireUser } from "~/lib/session";
import type { DashboardData, OrderStatus } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/icon";
import { MenuThumb } from "~/components/menu-thumb";
import { Segmented } from "~/components/segmented";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

type Range = "today" | "7d" | "30d" | "custom";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(ADMIN);
  const sp = new URL(request.url).searchParams;
  const start = sp.get("dari") ?? "";
  const end = sp.get("sampai") ?? "";
  const custom = !!(start && end);
  const range = (custom ? "custom" : (sp.get("rentang") ?? "30d")) as Range;
  const data = await api.dashboard(custom ? { startDate: start, endDate: end } : { range });
  return { data, range, fetchedAt: Date.now() };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
/** Bucket keys are local dates ("2026-11-24") or hours ("2026-11-24T10:00"); read them without timezone shifts. */
const bucketLabel = (key: string) => {
  if (key.includes("T")) return key.slice(11, 16).replace(":", ".");
  const [, m, d] = key.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
};

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { data, range, fetchedAt } = loaderData;
  const [, setSp] = useSearchParams();
  const revalidator = useRevalidator();
  const [showCustom, setShowCustom] = useState(range === "custom");
  const [from, setFrom] = useState(data.period.startDate);
  const [to, setTo] = useState(data.period.endDate);

  const pickRange = (r: Range) => {
    if (r === "custom") return setShowCustom(true);
    setShowCustom(false);
    setSp(r === "30d" ? {} : { rentang: r }, { replace: true });
  };

  const refreshing = revalidator.state === "loading";
  const s = data.summary;

  return (
    <CmsPage
      title="Dasbor"
      lead={`Hanya pesanan yang sudah dibayar yang dihitung · diperbarui ${formatTime(new Date(fetchedAt).toISOString())}`}
      actions={
        <Button className={onBand} size="sm" onClick={() => revalidator.revalidate()} disabled={refreshing}>
          <Icon name="retry" className={cn(refreshing && "animate-spin")} />
          Muat ulang
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Periode"
          value={showCustom ? "custom" : range}
          onChange={pickRange}
          options={[
            { value: "today", label: "Hari ini" },
            { value: "7d", label: "7 hari" },
            { value: "30d", label: "30 hari" },
            { value: "custom", label: "Pilih tanggal" },
          ]}
        />
        {showCustom && (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => (e.preventDefault(), from && to && setSp({ dari: from, sampai: to }, { replace: true }))}
          >
            <Input type="date" aria-label="Dari tanggal" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-10 w-40 text-sm" required />
            <span className="type-body-s text-ink-soft">sampai</span>
            <Input type="date" aria-label="Sampai tanggal" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-10 w-40 text-sm" required />
            <Button type="submit" size="sm" variant="secondary">
              Terapkan
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Pendapatan" value={rupiah(s.totalRevenue)} />
        <Metric label="Pesanan dibayar / masuk" value={`${s.paidOrders} / ${s.totalOrders}`} />
        <Metric label="Rata-rata per pesanan" value={rupiah(s.averageOrderValue)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan per {data.period.granularity === "hour" ? "jam" : "hari"}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart points={data.revenueChart} period={`${data.period.startDate}/${data.period.endDate}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid">
              {(["pending", "preparing", "ready", "completed", "cancelled"] as OrderStatus[]).map((st) => (
                <li key={st} className="flex items-center justify-between border-b py-2.5 last:border-b-0">
                  <Badge variant={STATUS_BADGE[st]}>{STATUS_LABEL[st]}</Badge>
                  <span className="type-label-m tabular-nums">{data.ordersByStatus[st] ?? 0}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/cms/pesanan" prefetch="intent">
                Buka antrean pesanan
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Menu terlaris</CardTitle>
            <CardDescription>Berdasarkan jumlah terjual</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topMenuItems.length === 0 ? (
              <EmptyLine text="Belum ada penjualan di periode ini." />
            ) : (
              <ol className="grid gap-3">
                {data.topMenuItems.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <span className="w-4 type-label-s text-ink-faint tabular-nums">{i + 1}</span>
                    <MenuThumb src={m.imageUrl} type={m.type} alt="" className="size-10 rounded-md" />
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate type-label-s">{m.name}</span>
                      <span className="type-body-xs text-ink-soft tabular-nums">{rupiah(m.revenue)}</span>
                    </span>
                    <span className="type-label-s tabular-nums">{m.quantitySold}×</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penjualan per kategori</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <ShareList
              rows={data.salesByCategory.map((c) => ({
                label: TYPE_LABEL[c.type],
                value: c.revenue,
                sub: `${c.quantitySold} item`,
              }))}
            />
            <div className="grid gap-3">
              <p className="type-label-m">Metode pembayaran</p>
              <ShareList
                rows={data.salesByPaymentMethod.map((p) => ({
                  label: PAYMENT_LABEL[p.paymentMethod],
                  value: p.revenue,
                  sub: `${p.ordersCount} pesanan`,
                }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Pesanan terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <EmptyLine text="Belum ada pesanan di periode ini." />
            ) : (
              <ul className="grid">
                {data.recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate type-label-s">
                        {o.customerName} · Meja {o.tableNumber}
                      </span>
                      <span className="type-body-xs text-ink-soft tabular-nums">
                        {o.invoiceNumber} · {formatTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="grid justify-items-end gap-1">
                      <span className="type-label-s tabular-nums">{rupiah(o.total)}</span>
                      <Badge variant={STATUS_BADGE[o.status]} size="sm">
                        {STATUS_LABEL[o.status]}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </CmsPage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-secondary p-5 dark:ring-1 dark:ring-border">
      <span className="type-label-s text-ink-soft">{label}</span>
      <p className="type-display-s leading-tight text-ink-brand tabular-nums">{value}</p>
    </div>
  );
}

function RevenueChart({ points, period }: { points: DashboardData["revenueChart"]; period: string }) {
  const [active, setActive] = useState<number | null>(null);
  // Bars move to their new heights only when the period changes, not on a refresh. Bars are keyed
  // by position so they persist; ones the new period adds grow from zero.
  const seen = useRef({ period, count: points.length, until: 0, grownFrom: points.length });
  if (seen.current.period !== period) {
    seen.current = { period, count: points.length, until: Date.now() + 450, grownFrom: seen.current.count };
  }
  const moving = Date.now() < seen.current.until;
  const max = Math.max(...points.map((p) => p.revenue), 0);
  // A round axis top: 1, 2 or 5 × 10^n
  const top =
    max === 0
      ? 100_000
      : (() => {
          const p = 10 ** Math.floor(Math.log10(max));
          return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= max)!;
        })();
  const short = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("id-ID")} jt` : n >= 1000 ? `${n / 1000} rb` : String(n);
  const shown = active ?? points.reduce((best, p, i) => (p.revenue > points[best].revenue ? i : best), 0);
  const labelEvery = Math.ceil(points.length / 8);

  if (points.length === 0) return <EmptyLine text="Tidak ada data untuk periode ini." />;

  return (
    <div className="grid gap-3">
      <p className="type-body-s text-ink-soft" aria-live="polite">
        <span className="type-label-s text-ink">{bucketLabel(points[shown].date)}</span> · {rupiah(points[shown].revenue)} ·{" "}
        {points[shown].ordersCount} pesanan
      </p>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2" aria-hidden>
        <div className="-mt-2 mb-6 flex h-48 flex-col-reverse justify-between text-right type-body-xs text-ink-soft tabular-nums">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <span key={f} className="h-0 translate-y-[-0.5rem] leading-4">
              {short(top * f)}
            </span>
          ))}
        </div>
        <div>
          <div
            className="flex h-48 items-end gap-0.5 border-b border-line-strong"
            style={{
              background: [0, 25, 50, 75]
                .map((y) => `linear-gradient(var(--ds-line), var(--ds-line)) 0 ${y}% / 100% 1px no-repeat`)
                .join(","),
            }}
          >
            {points.map((p, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={cn(
                  "flex h-full min-w-0 flex-1 items-end justify-center rounded-t-md",
                  i === shown && "bg-[light-dark(#0000000A,#FFFFFF0F)]",
                )}
              >
                <span
                  className={cn(
                    "block w-[min(24px,70%)] rounded-t-[4px]",
                    moving && "transition-[height] duration-[400ms] ease-out",
                    moving && i >= seen.current.grownFrom && "animate-[bar-grow_400ms_ease-out]",
                  )}
                  style={{
                    height: `${(p.revenue / top) * 100}%`,
                    minHeight: p.revenue > 0 ? 2 : 0,
                    background:
                      i === shown ? "var(--ds-series-brand)" : "color-mix(in srgb, var(--ds-series-brand) 55%, var(--ds-bg-surface))",
                  }}
                />
              </button>
            ))}
          </div>
          <div className="flex h-6 items-start gap-0.5 pt-1 type-body-xs text-ink-soft">
            {points.map((p, i) => (
              <span key={p.date} className="min-w-0 flex-1 text-center whitespace-nowrap">
                {i % labelEvery === 0 ? bucketLabel(p.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* The chart is drawn for eyes; this is the same data for keyboards and screen readers */}
      <details className="type-body-s">
        <summary className="w-fit cursor-pointer rounded-sm type-label-s text-ink-brand">Lihat sebagai tabel</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full type-body-s">
            <thead>
              <tr className="border-b text-left type-label-xs text-ink-soft">
                <th className="py-2">Waktu</th>
                <th className="py-2 text-right">Pesanan</th>
                <th className="py-2 text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-b last:border-b-0">
                  <td className="py-1.5">{bucketLabel(p.date)}</td>
                  <td className="py-1.5 text-right">{p.ordersCount}</td>
                  <td className="py-1.5 text-right">{rupiah(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function ShareList({ rows }: { rows: { label: string; value: number; sub: string }[] }) {
  const total = rows.reduce((n, r) => n + r.value, 0);
  if (total === 0) return <EmptyLine text="Belum ada penjualan di periode ini." />;
  return (
    <ul className="grid gap-3">
      {rows.map((r) => {
        const pct = Math.round((r.value / total) * 100);
        return (
          <li key={r.label} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="type-label-s">{r.label}</span>
              <span className="type-body-s tabular-nums">
                {rupiah(r.value)} <span className="text-ink-faint">· {pct}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-[var(--ds-series-brand)]" style={{ width: `${pct}%` }} />
            </div>
            <span className="type-body-xs text-ink-soft">{r.sub}</span>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="py-6 text-center type-body-s text-ink-soft">{text}</p>;
}
