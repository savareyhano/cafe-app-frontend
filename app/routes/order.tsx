import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import type { Route } from './+types/order';
import { api, errorMessage, fetchAll } from '~/lib/api';
import { readTable, useCart, type CartLine } from '~/lib/cart';
import { CAFE_NAME } from '~/lib/config';
import { rupiah, TYPE_LABEL } from '~/lib/format';
import { LABEL_STYLE, LABELS, useMenuDemo, type Label } from '~/lib/menu-demo';
import { equalShares, personShares } from '~/lib/split';
import { recentOrders } from '~/lib/storage';
import type { Banner, MenuItem, PaymentMethod } from '~/lib/types';
import { cn } from '~/lib/utils';
import { Brand } from '~/components/brand';
import { Icon } from '~/components/icon';
import { MenuThumb } from '~/components/menu-thumb';
import { Segmented } from '~/components/segmented';
import { SiteFooter } from '~/components/site-footer';
import { Stepper } from '~/components/stepper';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { Spinner } from '~/components/ui/spinner';
import { Switch } from '~/components/ui/switch';
import { AnimatePresence, m } from 'motion/react';
import { EASE_IN, EASE_OUT } from '~/components/page-fade';
import { ModeToggle } from '~/components/mode-toggle';

export async function clientLoader() {
  const [menu, banners] = await Promise.all([
    fetchAll((page) =>
      api.menuItems({ page, perPage: 100, sortBy: 'name', sortOrder: 'asc' }),
    ),
    // Banners are decoration for the menu: a failure must not block ordering
    api.publicBanners().catch(() => [] as Banner[]),
  ]);
  return { menu, banners };
}

export function meta() {
  return [
    { title: `Menu · ${CAFE_NAME}` },
    {
      name: 'description',
      content: `Pesan langsung dari meja di ${CAFE_NAME}.`,
    },
  ];
}

export default function OrderPage({ loaderData }: Route.ComponentProps) {
  const { menu, banners } = loaderData;
  const [params] = useSearchParams();
  const [table, setTable] = useState<number | null>(null);
  const cart = useCart();
  const [query, setQuery] = useState('');
  // A category id from the CMS's category list, or 'all'
  const [filter, setFilter] = useState('all');
  const demo = useMenuDemo();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [detail, setDetail] = useState<{
    open: boolean;
    item: MenuItem | null;
  }>({ open: false, item: null });
  const [hasOrders, setHasOrders] = useState(false);

  useEffect(() => setTable(readTable(params)), [params]);
  useEffect(() => setHasOrders(recentOrders.list().length > 0), []);

  const byId = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);
  const { prune } = cart;
  useEffect(() => prune(new Set(byId.keys())), [byId, prune]);

  const q = query.trim().toLowerCase();
  const visible = menu.filter(
    (m) =>
      (filter === 'all' || demo.categoryOf(m) === filter) &&
      (!q ||
        m.name.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)),
  );

  // One section per category, in the CMS's order; empty categories stay hidden from customers
  const sections = demo.categories
    .map((c) => ({
      id: c.id,
      title: c.name,
      items: visible.filter((m) => demo.categoryOf(m) === c.id),
    }))
    .filter((s) => s.items.length > 0);
  const filters: { key: string; label: string; thumb?: MenuItem }[] = [
    { key: 'all', label: 'Semua' },
    ...demo.categories.flatMap((c) => {
      const list = menu.filter((m) => demo.categoryOf(m) === c.id);
      // Each chip shows one of its dishes, like the category cards in the console
      return list.length ? [{ key: c.id, label: c.name, thumb: list.find((m) => m.imageUrl) ?? list[0] }] : [];
    }),
  ];

  const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
  const total = cart.lines.reduce(
    (n, l) => n + l.quantity * (byId.get(l.menuItemId)?.price ?? 0),
    0,
  );

  const openDetail = (item: MenuItem) => setDetail({ open: true, item });

  const focusDish = (id: string) => {
    const item = byId.get(id);
    if (!item) return;
    setQuery('');
    setFilter('all');
    openDetail(item);
    requestAnimationFrame(() => {
      document
        .getElementById(`dish-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col bg-canvas md:max-w-3xl">
      {/* The name row scrolls away so phones keep more of the menu in view */}
      <header className="bg-surface pt-2">
        <div className="flex min-h-12 items-center gap-2 px-4">
          <Brand className="flex-1" sub={table ? `Meja ${table}` : 'Menu'} />
          {hasOrders && (
            <Button asChild variant="ghost" size="sm" className="px-3">
              <Link to="/pesanan" prefetch="intent">
                <Icon name="my-orders" className="size-5" />
                Pesanan saya
              </Link>
            </Button>
          )}
          <ModeToggle />
        </div>
      </header>

      {/* Sticky: search and filters stay in reach */}
      <div className="sticky top-0 z-20 grid gap-3 bg-surface py-3 shadow-[0_1px_0_var(--ds-line)]">
        <div className="px-4">
          <label className="relative block">
            <span className="sr-only">Cari menu</span>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-faint"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari makanan atau minuman"
              className="h-11 bg-background pl-11"
            />
          </label>
        </div>
        <div
          className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]"
          role="group"
          aria-label="Kategori"
        >
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={(e) => {
                setFilter(f.key);
                // The row scrolls sideways; keep the picked category in view
                e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
              }}
              className="flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface py-1 pr-4 pl-1 type-label-s whitespace-nowrap text-ink-soft transition-colors duration-[120ms] hover:bg-fill-hover aria-pressed:border-transparent aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {f.thumb ? (
                <MenuThumb src={f.thumb.imageUrl} type={f.thumb.type} alt="" className="size-8 rounded-full" />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-muted text-ink-soft">
                  <Icon name="food-menu" className="size-4" />
                </span>
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="grid flex-1 content-start gap-4 pt-4 pb-6">
        {!table && (
          <div
            role="status"
            className="mx-4 flex items-start gap-3 rounded-lg bg-warning-tint p-4 text-warning-ink"
          >
            <Icon name="scan" className="mt-0.5 size-5" />
            <p className="type-body-s">
              <span className="block type-label-s">
                Pindai kode QR di meja Anda untuk memesan
              </span>
              Anda tetap bisa melihat menu. Pemesanan dibuka setelah nomor meja
              terbaca dari QR.
            </p>
          </div>
        )}

        {banners.length > 0 && !query && (
          <BannerRail
            banners={banners}
            onPick={(id) => byId.has(id) && focusDish(id)}
          />
        )}

        {menu.length === 0 ? (
          <Empty className="mx-4 w-auto rounded-lg bg-surface">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name="food-menu" />
              </EmptyMedia>
              <EmptyTitle>Menu belum tersedia</EmptyTitle>
              <EmptyDescription>
                Kami sedang menyiapkan menu. Tanyakan ke staf untuk pesanan
                langsung.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : sections.length === 0 ? (
          <Empty className="mx-4 w-auto rounded-lg bg-surface">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name="search" />
              </EmptyMedia>
              <EmptyTitle>
                {query ? <>Tidak ada yang cocok dengan “{query}”</> : 'Belum ada menu di kategori ini'}
              </EmptyTitle>
            </EmptyHeader>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (setQuery(''), setFilter('all'))}
            >
              {query ? 'Hapus pencarian' : 'Lihat semua menu'}
            </Button>
          </Empty>
        ) : (
          sections.map((s) => (
            <section
              key={s.id}
              aria-labelledby={`sec-${s.id}`}
              className="grid gap-3 px-4 pt-2"
            >
              <h2 id={`sec-${s.id}`} className="type-label-l text-xl">
                {s.title}
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {s.items.map((m) => (
                  <DishRow
                    key={m.id}
                    item={m}
                    label={demo.labelOf(m.id)}
                    qty={cart.qtyOf(m.id)}
                    onQty={(n) => cart.setQty(m.id, n)}
                    onPreview={() => openDetail(m)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      <SiteFooter />

      <AnimatePresence>
        {count > 0 && (
          <m.div
            key="cart"
            className="sticky bottom-0 z-20 px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 0.28, ease: EASE_OUT },
            }}
            exit={{
              y: '100%',
              opacity: 0,
              transition: { duration: 0.2, ease: EASE_IN },
            }}
          >
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="flex min-h-14 w-full items-center gap-3 rounded-full bg-primary py-2 pr-2 pl-5 text-left text-primary-foreground shadow-ds-2 transition-[background-color,scale] duration-100 ease-out hover:bg-brand-hover active:scale-[0.985] active:bg-brand-press"
            >
              <span className="grid flex-1">
                {/* Bumps each time the count changes */}
                <m.span
                  key={count}
                  className="w-fit origin-left type-label-m"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  {count} item
                </m.span>
                <span className="type-body-xs opacity-85">
                  {table ? `Meja ${table}` : 'Lihat pesanan'}
                </span>
              </span>
              <span className="type-label-m tabular-nums">{rupiah(total)}</span>
              <span className="grid size-10 place-items-center rounded-full bg-primary-foreground text-primary">
                <Icon name="next" />
              </span>
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <MenuDetailDialog
        open={detail.open}
        item={detail.item}
        cartQty={detail.item ? cart.qtyOf(detail.item.id) : 0}
        cartNote={detail.item ? cart.noteOf(detail.item.id) : ''}
        onOpenChange={(open) => setDetail((prev) => ({ ...prev, open }))}
        onCommit={(id, qty, note) => cart.setLine(id, qty, note)}
      />

      <CheckoutSheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        lines={cart.lines}
        byId={byId}
        table={table}
        total={total}
        onQty={cart.setQty}
        onNote={cart.setNote}
        onPlaced={cart.clear}
      />
    </div>
  );
}

const AUTO_SLIDE_MS = 4500;

/**
 * Promo carousel: swipe (touch), drag (mouse) or tap a dot to move; it advances on its own every
 * few seconds, pausing while the visitor touches, hovers or focuses it. The parent renders it
 * only when there are active banners (the public endpoint returns active ones only).
 */
function BannerRail({
  banners,
  onPick,
}: {
  banners: Banner[];
  onPick: (menuItemId: string) => void;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const many = banners.length > 1;

  // Slide changes are animated here rather than with scrollTo({behavior:"smooth"}): the duration
  // and curve stay the same in every browser, and snapping stays off until the slide has landed,
  // so it never jumps at the end. It glides even with the OS "reduce motion" setting on (the
  // owner's request); it's a short horizontal move with no scaling or parallax.
  const anim = useRef(0);
  const goTo = (i: number) => {
    const el = rail.current;
    const item = el?.children[i] as HTMLElement | undefined;
    if (!el || !item) return;
    cancelAnimationFrame(anim.current);
    const start = el.scrollLeft;
    // Slides snap to the centre, so the target puts this slide in the middle of the rail
    const end = Math.max(
      0,
      Math.min(
        item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2,
        el.scrollWidth - el.clientWidth,
      ),
    );
    const t0 = performance.now();
    const duration = 420;
    el.style.scrollSnapType = 'none';
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      el.scrollLeft = start + (end - start) * (1 - Math.pow(1 - t, 3)); // ease-out cubic
      if (t < 1) anim.current = requestAnimationFrame(frame);
      else el.style.scrollSnapType = '';
    };
    anim.current = requestAnimationFrame(frame);
  };
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  /** Slide nearest the current scroll position. */
  const nearest = () => {
    const el = rail.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return 0;
    return Math.min(
      banners.length - 1,
      // Slide width plus whatever gap this breakpoint uses
      Math.round(el.scrollLeft / (first.offsetWidth + parseFloat(getComputedStyle(el).columnGap))),
    );
  };
  const onScroll = () => setIndex(nearest());

  // Mouse drag. Touch keeps the browser's native swipe and snap, which is already smooth.
  const drag = useRef<{
    x: number;
    left: number;
    dx: number;
    from: number;
    v: number;
    t: number;
  } | null>(null);
  const dragged = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    const el = rail.current;
    if (!el || !many || e.pointerType !== 'mouse' || e.button !== 0) return;
    cancelAnimationFrame(anim.current); // grab it mid-glide without a jump
    drag.current = {
      x: e.clientX,
      left: el.scrollLeft,
      dx: 0,
      from: nearest(),
      v: 0,
      t: e.timeStamp,
    };
    dragged.current = false;
    el.style.scrollSnapType = 'none'; // snapping would fight every pixel of the drag
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = ev.clientX - d.x;
      // Velocity of the last move, px/ms, for flick detection on release
      d.v = (dx - d.dx) / Math.max(1, ev.timeStamp - d.t);
      d.t = ev.timeStamp;
      d.dx = dx;
      if (Math.abs(dx) > 5) dragged.current = true;
      el.scrollLeft = d.left - dx;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      // A quick flick or a drag past a third of a slide moves one slide; otherwise settle back
      const slide = (el.children[0] as HTMLElement).offsetWidth;
      const go =
        Math.abs(d.v) > 0.3
          ? -Math.sign(d.v)
          : Math.abs(d.dx) > slide / 3
            ? -Math.sign(d.dx)
            : 0;
      goTo(Math.max(0, Math.min(banners.length - 1, d.from + go)));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // The active dot's fill animation is the auto-slide timer: pausing it pauses the countdown, and
  // it resumes with the time that was left. A background tab pauses it too.
  useEffect(() => {
    const on = () => setHidden(document.visibilityState !== 'visible');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  const next = () => goTo((index + 1) % banners.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promo"
      className="@container grid gap-2"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), AUTO_SLIDE_MS)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ul
        ref={rail}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        // A drag must not also count as a tap on the banner
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
            dragged.current = false;
          }
        }}
        className={cn(
          'relative grid snap-x snap-mandatory grid-flow-col gap-3 overflow-x-auto overscroll-x-contain select-none [scrollbar-width:none]',
          // Several slides: on phones the active one sits in the middle with its neighbours peeking
          // in; from md up one slide fills the column, in line with the menu cards
          many
            ? 'cursor-grab auto-cols-[min(88cqw,26rem)] px-[calc((100cqw-min(88cqw,26rem))/2)] active:cursor-grabbing md:auto-cols-[calc(100cqw-2rem)] md:gap-4 md:px-4'
            : 'auto-cols-[100%] px-4 md:auto-cols-[min(100%,36rem)]',
        )}
      >
        {banners.map((b, i) => {
          const img = (
            <img
              src={b.imageUrl}
              alt={b.menuItems ? b.menuItems.name : 'Promo'}
              width={832}
              height={416}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : undefined}
              draggable={false}
              className="aspect-[2/1] w-full rounded-2xl bg-muted object-cover shadow-ds-1 ring-1 ring-line md:aspect-[5/2]"
            />
          );
          return (
            <li
              key={b.id}
              className={cn('snap-always', many ? 'snap-center' : 'snap-start')}
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${banners.length}`}
            >
              {b.menuItems ? (
                <button
                  type="button"
                  onClick={() => onPick(b.menuItems!.id)}
                  className="block w-full rounded-2xl text-left"
                  aria-label={`Lihat ${b.menuItems.name} di menu`}
                >
                  {img}
                </button>
              ) : (
                img
              )}
            </li>
          );
        })}
      </ul>
      {many && (
        // Carousel position dots; each has a 24px hit area around a small mark
        <div className="flex justify-center">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Promo ${i + 1} dari ${banners.length}`}
              aria-current={i === index ? 'true' : undefined}
              className="group grid h-6 w-5 place-items-center"
            >
              <span className="relative h-1.5 w-1.5 overflow-hidden rounded-full bg-line-strong transition-[width,background-color] duration-200 group-aria-[current=true]:w-4 group-aria-[current=true]:bg-[color-mix(in_srgb,var(--ds-selected)_30%,transparent)]">
                {i === index && (
                  <span
                    key={index}
                    data-carousel-timer
                    onAnimationEnd={next}
                    style={{
                      animationDuration: `${AUTO_SLIDE_MS}ms`,
                      animationPlayState:
                        paused || hidden ? 'paused' : 'running',
                    }}
                    className="absolute inset-0 origin-left animate-[carousel-timer_linear_forwards] rounded-full bg-[var(--ds-selected)]"
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function DishRow({
  item,
  label,
  qty,
  onQty,
  onPreview,
}: {
  item: MenuItem;
  label?: Label;
  qty: number;
  onQty: (n: number) => void;
  onPreview: () => void;
}) {
  return (
    <li
      id={`dish-${item.id}`}
      className="relative grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 rounded-2xl border border-line bg-surface p-3 shadow-ds-1 transition-colors duration-[120ms] hover:bg-fill-hover active:bg-fill-press"
    >
      {/* Stretched button makes the entire dish card clickable while keeping quick-add controls separate */}
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Lihat detail ${item.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-2xl focus-visible:outline-offset-[-2px]"
      />
      <div className="pointer-events-none relative">
        <MenuThumb src={item.imageUrl} type={item.type} alt={item.name} className="rounded-xl" />
        {label && (
          <span
            className={cn(
              'absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 type-label-xs',
              LABEL_STYLE[label].className,
            )}
          >
            <Icon name={LABEL_STYLE[label].icon} className="size-3.5" />
            {LABELS[label]}
          </span>
        )}
      </div>
      <div className="pointer-events-none grid min-w-0 content-between gap-2">
        <div className="grid gap-1">
          <h3 className="type-label-m">{item.name}</h3>
          {item.description && (
            <p className="line-clamp-2 type-body-s text-ink-soft">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex min-h-10 items-center justify-between gap-2">
          <span className="type-label-m tabular-nums">
            {rupiah(item.price)}
          </span>
          <div className="pointer-events-auto relative z-10">
            {qty > 0 ? (
              <Stepper value={qty} onChange={onQty} name={item.name} />
            ) : (
              <Button
                variant="outline"
                size="xs"
                className="h-9 px-4"
                onClick={() => onQty(1)}
                aria-label={`Tambah ${item.name}`}
              >
                <Icon name="plus" />
                Tambah
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function MenuDetailDialog({
  open,
  item,
  cartQty,
  cartNote,
  onOpenChange,
  onCommit,
}: {
  open: boolean;
  item: MenuItem | null;
  cartQty: number;
  cartNote: string;
  onOpenChange: (open: boolean) => void;
  onCommit: (menuItemId: string, quantity: number, note: string) => void;
}) {
  const [draftQty, setDraftQty] = useState(1);
  const [draftNote, setDraftNote] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    setDraftQty(cartQty > 0 ? cartQty : 1);
    setDraftNote(cartNote);
  }, [open, item?.id, cartQty, cartNote]);

  const inCart = cartQty > 0;
  const minQty = inCart ? 0 : 1;

  const commit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!item) return;
    onCommit(item.id, draftQty, draftNote);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md max-sm:pt-0 max-sm:pb-0 before:hidden"
      >
        {item && (
          <form onSubmit={commit} className="flex max-h-[92dvh] flex-col">
            <div className="relative shrink-0 touch-none select-none max-sm:cursor-grab max-sm:active:cursor-grabbing">
              <span
                aria-hidden
                className="pointer-events-none absolute top-2.5 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/85 shadow-ds-1 sm:hidden"
              />
              <MenuThumb
                src={item.imageUrl}
                type={item.type}
                alt={item.name}
                eager
                className="aspect-[16/10] max-h-60 w-full rounded-none"
              />
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3 z-10 bg-surface/90 text-ink shadow-ds-1 backdrop-blur-xs hover:bg-surface"
                >
                  <Icon name="cancel" className="size-5" />
                  <span className="sr-only">Tutup</span>
                </Button>
              </DialogClose>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto px-5 pt-4 pb-5">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="brand" size="sm">
                    {TYPE_LABEL[item.type]}
                  </Badge>
                  <span className="type-label-m tabular-nums">
                    {rupiah(item.price)}
                  </span>
                </div>
                <DialogTitle className="pr-0 type-display-xs">
                  {item.name}
                </DialogTitle>
                {item.description ? (
                  <DialogDescription className="type-body-m whitespace-pre-line text-ink-soft">
                    {item.description}
                  </DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">
                    Detail menu {item.name}
                  </DialogDescription>
                )}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="detail-note" className="type-label-s">
                  Catatan{' '}
                  <span className="font-normal text-ink-faint">(opsional)</span>
                </label>
                <div className="relative">
                  <Icon
                    name="notes"
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
                  />
                  <Input
                    id="detail-note"
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="mis. tidak pedas, sedikit es"
                    maxLength={200}
                    className="h-10 pl-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t bg-popover px-5 py-4 max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Stepper
                value={draftQty}
                onChange={setDraftQty}
                name={item.name}
                min={minQty}
              />
              {inCart && draftQty === 0 ? (
                <Button
                  type="submit"
                  variant="destructive-outline"
                  className="flex-1"
                >
                  Hapus dari pesanan
                </Button>
              ) : (
                <Button type="submit" className="flex-1">
                  {inCart ? 'Simpan' : 'Tambah'} ·{' '}
                  {rupiah(item.price * draftQty)}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckoutSheet({
  open,
  onOpenChange,
  lines,
  byId,
  table,
  total,
  onQty,
  onNote,
  onPlaced,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lines: CartLine[];
  byId: Map<string, MenuItem>;
  table: number | null;
  total: number;
  onQty: (id: string, n: number) => void;
  onNote: (id: string, note: string) => void;
  onPlaced: () => void;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cashless');
  const [nameError, setNameError] = useState('');
  const [busy, setBusy] = useState<'' | 'placing' | 'redirecting'>('');
  // The dish whose empty note field was just opened; fields with text always show
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Close the sheet when the last item is removed
  useEffect(() => {
    if (open && lines.length === 0 && !busy) onOpenChange(false);
  }, [open, lines.length, busy, onOpenChange]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!table || busy) return;
    if (!name.trim()) {
      setNameError(
        'Isi nama Anda supaya staf bisa memanggil saat pesanan siap.',
      );
      nameRef.current?.focus();
      return;
    }
    setBusy('placing');
    try {
      const { data } = await api.addOrder({
        customerName: name.trim(),
        customerPhoneNumber: phone.trim() || undefined,
        tableNumber: table,
        paymentMethod: payment,
        orderItems: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          note: l.note.trim() || undefined,
        })),
      });
      recentOrders.add(data.orderId);
      onPlaced();
      if (payment === 'cashless' && data.redirectUrl) {
        setBusy('redirecting');
        window.location.assign(data.redirectUrl);
        return;
      }
      navigate(`/pesanan?order_id=${data.orderId}`);
    } catch (err) {
      toast.error('Pesanan belum terkirim', { description: errorMessage(err) });
      setBusy('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-[30rem] gap-0 overflow-y-auto bg-background md:max-w-xl"
      >
        <SheetHeader className="pb-3">
          <SheetTitle>Pesanan Anda</SheetTitle>
          <SheetDescription>
            {table ? `Diantar ke meja ${table}` : 'Nomor meja belum terbaca'}
          </SheetDescription>
        </SheetHeader>

        <form id="checkout" onSubmit={submit} className="grid gap-3 px-4 pb-3">
          <Step n={1} title="Pesanan">
          <ul className="grid">
            {lines.map((l) => {
              const m = byId.get(l.menuItemId);
              if (!m) return null;
              return (
                <li
                  key={l.menuItemId}
                  className="grid gap-2 border-b py-3 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MenuThumb
                      src={m.imageUrl}
                      type={m.type}
                      alt=""
                      className="size-12 rounded-md"
                    />
                    <div className="grid min-w-0 flex-1">
                      <span className="type-label-s">{m.name}</span>
                      <span className="type-body-s text-ink-soft tabular-nums">
                        {rupiah(m.price * l.quantity)}
                      </span>
                    </div>
                    <Stepper
                      value={l.quantity}
                      onChange={(n) => onQty(m.id, n)}
                      name={m.name}
                    />
                  </div>
                  {l.note || noteOpen === m.id ? (
                    <label className="relative block">
                      <span className="sr-only">Catatan untuk {m.name}</span>
                      <Icon
                        name="notes"
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
                      />
                      <Input
                        autoFocus={noteOpen === m.id}
                        value={l.note}
                        onChange={(e) => onNote(m.id, e.target.value)}
                        onBlur={() => setNoteOpen(null)}
                        placeholder="Catatan, mis. tidak pedas"
                        maxLength={200}
                        className="h-10 pl-10 text-sm"
                      />
                    </label>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-fit px-3 text-ink-soft"
                      onClick={() => setNoteOpen(m.id)}
                      aria-label={`Tambah catatan untuk ${m.name}`}
                    >
                      <Icon name="plus" />
                      Tambah catatan
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          </Step>

          <Step n={2} title="Data pemesan">
          <Field data-invalid={!!nameError}>
            <FieldLabel htmlFor="customer-name">Nama</FieldLabel>
            <Input
              ref={nameRef}
              id="customer-name"
              autoComplete="name"
              value={name}
              maxLength={255}
              aria-invalid={!!nameError}
              onChange={(e) => (setName(e.target.value), setNameError(''))}
              placeholder="Nama untuk dipanggil"
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="customer-phone">
              Nomor HP{' '}
              <span className="font-normal text-ink-faint">(opsional)</span>
            </FieldLabel>
            <Input
              id="customer-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
              placeholder="08xxxxxxxxxx"
            />
          </Field>
          </Step>

          <Step n={3} title="Pembayaran" fieldset>
            <RadioGroup
              value={payment}
              onValueChange={(v) => setPayment(v as PaymentMethod)}
              className="grid-cols-2 gap-2"
              aria-describedby="payment-hint"
            >
              {(
                [
                  ['cashless', 'Non-tunai', 'wallet'],
                  ['cash', 'Tunai', 'cash'],
                ] as const
              ).map(([value, title, icon]) => (
                <label
                  key={value}
                  className="flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3 transition-colors hover:bg-fill-hover has-data-checked:border-transparent has-data-checked:bg-secondary has-data-checked:shadow-[inset_0_0_0_2px_var(--ds-selected)]"
                >
                  <Icon name={icon} className="size-5 text-ink-soft" />
                  <span className="flex-1 type-label-s whitespace-nowrap">{title}</span>
                  <RadioGroupItem value={value} aria-label={title} />
                </label>
              ))}
            </RadioGroup>
            <p id="payment-hint" className="type-body-xs text-ink-soft">
              {payment === 'cash'
                ? 'Bayar di kasir, lalu pesanan mulai dibuat.'
                : 'QRIS, e-wallet, kartu, atau transfer bank.'}
            </p>
          </Step>

          <SplitBill lines={lines} byId={byId} total={total} />
        </form>

        <SheetFooter className="sticky bottom-0 gap-2 border-t bg-popover">
          <div className="flex items-baseline justify-between">
            <span className="type-body-s text-ink-soft">Total</span>
            <span className="type-label-l tabular-nums">{rupiah(total)}</span>
          </div>
          {!table && (
            <FieldDescription className="text-warning-ink">
              Pindai kode QR di meja untuk mengirim pesanan.
            </FieldDescription>
          )}
          <Button
            type="submit"
            form="checkout"
            size="lg"
            disabled={!table || !!busy || lines.length === 0}
          >
            {busy ? (
              <>
                <Spinner label={false} />
                {busy === 'redirecting'
                  ? 'Membuka pembayaran…'
                  : 'Mengirim pesanan…'}
              </>
            ) : payment === 'cash' ? (
              'Pesan, bayar di kasir'
            ) : (
              'Pesan dan bayar'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * One checkout step as an ivory card on the cream sheet, numbered because the order matters:
 * what you ordered, who you are, how you pay. `fieldset` keeps the radio group's grouping for
 * screen readers.
 */
function Step({
  n,
  title,
  fieldset,
  children,
}: {
  n: number;
  title: string;
  fieldset?: boolean;
  children: React.ReactNode;
}) {
  const heading = (
    <span className="flex items-center gap-2.5 type-label-m">
      <span className="grid size-6 place-items-center rounded-full bg-primary type-label-xs text-primary-foreground tabular-nums">
        {n}
      </span>
      {title}
    </span>
  );
  const card = 'grid min-w-0 gap-4 rounded-2xl border border-line bg-surface p-4 shadow-ds-1';
  return fieldset ? (
    <fieldset className={card}>
      {/* A legend can't be a grid item, so it floats and the next row clears it */}
      <legend className="float-left w-full">{heading}</legend>
      {children}
    </fieldset>
  ) : (
    <section className={card}>
      <h3>{heading}</h3>
      {children}
    </section>
  );
}

const MAX_PEOPLE = 10;

/**
 * Split-bill calculator, off by default. It only shows each person's share: the order is still
 * paid once, and the split isn't saved or sent to the cafe.
 */
function SplitBill({
  lines,
  byId,
  total,
}: {
  lines: CartLine[];
  byId: Map<string, MenuItem>;
  total: number;
}) {
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState<'equal' | 'person'>('equal');
  const [people, setPeople] = useState(2);
  // Portions of each dish per person (0-based); portions nobody took are shared by everyone
  const [taken, setTaken] = useState<Record<string, (number | undefined)[]>>({});

  const items = lines.flatMap((l) => {
    const m = byId.get(l.menuItemId);
    return m ? [{ id: m.id, name: m.name, price: m.price, quantity: l.quantity }] : [];
  });
  const everyone = [...Array(people).keys()];
  const mine = (id: string, p: number) => taken[id]?.[p] ?? 0;
  const left = (id: string, quantity: number) =>
    Math.max(0, quantity - everyone.reduce((n, p) => n + mine(id, p), 0));
  const split =
    mode === 'equal'
      ? { shares: equalShares(total, people), unassigned: 0 }
      : personShares(items, people, taken);
  const { shares, unassigned } = split;
  const rounded = shares.reduce((n, s) => n + s, 0) !== total;

  const setMine = (id: string, p: number, n: number) =>
    setTaken((t) => {
      const next = [...(t[id] ?? [])];
      next[p] = n;
      return { ...t, [id]: next };
    });

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-ds-1">
      <label htmlFor="split-toggle" className="flex cursor-pointer items-center gap-3">
        <Icon name="split-bill" className="size-6 text-ink-soft" />
        <span className="grid flex-1">
          <span className="type-label-s">Split bill</span>
          <span className="type-body-xs text-ink-soft">
            Hitung bagian tiap orang. Pembayaran tetap satu kali.
          </span>
        </span>
        <Switch id="split-toggle" checked={on} onCheckedChange={setOn} />
      </label>

      {on && (
        <>
          <Segmented
            label="Cara membagi"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'equal', label: 'Bagi rata' },
              { value: 'person', label: 'Per orang' },
            ]}
            className="[&>button]:flex-1"
          />

          <div className="flex items-center justify-between gap-3">
            <span className="type-label-s">Jumlah orang</span>
            <Stepper
              value={people}
              onChange={setPeople}
              name="orang"
              min={2}
              max={MAX_PEOPLE}
            />
          </div>

          {mode === 'person' ? (
            <ul className="grid gap-3">
              {everyone.map((p) => (
                <li
                  key={p}
                  aria-labelledby={`split-person-${p}`}
                  className="grid gap-2 rounded-xl bg-muted p-3"
                >
                  <div className="flex items-baseline justify-between gap-2" aria-live="polite">
                    <span id={`split-person-${p}`} className="type-label-s">
                      Orang {p + 1}
                    </span>
                    <span className="type-label-m tabular-nums">{rupiah(shares[p])}</span>
                  </div>
                  {items.map((it) => {
                    const n = mine(it.id, p);
                    const rest = left(it.id, it.quantity);
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-2">
                        <span className="grid min-w-0">
                          <span className="truncate type-body-s">{it.name}</span>
                          <span className="type-body-xs text-ink-soft tabular-nums">
                            {rupiah(it.price)}
                            {it.quantity > 1 && ` · sisa ${rest} dari ${it.quantity}`}
                          </span>
                        </span>
                        <Stepper
                          value={n}
                          onChange={(v) => setMine(it.id, p, v)}
                          name={`${it.name} untuk Orang ${p + 1}`}
                          max={n + rest}
                        />
                      </div>
                    );
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="flex items-baseline justify-between rounded-lg bg-muted p-3"
              aria-live="polite"
            >
              <span className="type-body-s text-ink-soft">Per orang</span>
              <span className="type-label-l tabular-nums">{rupiah(shares[0])}</span>
            </div>
          )}

          {(unassigned > 0 || rounded) && (
            <div className="grid gap-1 type-body-xs text-ink-soft">
              {unassigned > 0 && (
                <p>
                  Belum dipilih {rupiah(unassigned)}, dibagi rata ke semua orang.
                </p>
              )}
              {rounded && <p>Dibulatkan ke atas ke Rp100 terdekat.</p>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
