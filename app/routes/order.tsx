import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import type { Route } from './+types/order';
import { api, errorMessage, fetchAll } from '~/lib/api';
import { readTable, useCart, type CartLine } from '~/lib/cart';
import { CAFE_NAME } from '~/lib/config';
import { rupiah, TYPE_LABEL } from '~/lib/format';
import { openSnap } from '~/lib/snap';
import { MAX_PARTS, splitEvenly } from '~/lib/split';
import { recentOrders } from '~/lib/storage';
import type { Banner, MenuItem, MenuType, PaymentMethod, SplitMode } from '~/lib/types';
import { cn } from '~/lib/utils';
import { Brand } from '~/components/brand';
import { Icon } from '~/components/icon';
import { MenuThumb } from '~/components/menu-thumb';
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

const FILTERS: { key: 'all' | MenuType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'food', label: 'Makanan' },
  { key: 'drink', label: 'Minuman' },
];

export default function OrderPage({ loaderData }: Route.ComponentProps) {
  const { menu, banners } = loaderData;
  const [params] = useSearchParams();
  const [table, setTable] = useState<number | null>(null);
  const cart = useCart();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | MenuType>('all');
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter(
      (m) =>
        (filter === 'all' || m.type === filter) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)),
    );
  }, [menu, query, filter]);

  const sections = (['food', 'drink'] as const)
    .map((type) => ({
      type,
      title: type === 'food' ? 'Makanan' : 'Minuman',
      items: visible.filter((m) => m.type === type),
    }))
    .filter((s) => s.items.length > 0);

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
      {/* Sticky top: header, search and filters stay in reach */}
      <header className="sticky top-0 z-20 grid gap-3 bg-surface pt-2 pb-3 shadow-[0_1px_0_var(--ds-line)]">
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
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className="min-h-9 shrink-0 rounded-full border border-line-strong bg-surface px-4 type-label-s text-ink-soft transition-colors duration-[120ms] hover:bg-fill-hover aria-pressed:border-transparent aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

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
          <Empty className="mx-4 rounded-lg bg-surface">
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
          <Empty className="mx-4 rounded-lg bg-surface">
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
              Hapus pencarian
            </Button>
          </Empty>
        ) : (
          sections.map((s) => (
            <section
              key={s.type}
              aria-labelledby={`sec-${s.type}`}
              className="bg-surface px-4 pt-5 pb-1 md:mx-4 md:rounded-2xl"
            >
              <h2 id={`sec-${s.type}`} className="type-label-l text-xl">
                {s.title}
              </h2>
              <ul className="md:grid md:grid-cols-2 md:gap-x-6">
                {s.items.map((m) => (
                  <DishRow
                    key={m.id}
                    item={m}
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
      Math.round(el.scrollLeft / (first.offsetWidth + 12)),
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
          // Several slides: the active one sits in the middle with its neighbours peeking in, so
          // every slide (first and last too) can be centred and the focus is never between two
          many
            ? 'cursor-grab auto-cols-[min(88cqw,26rem)] px-[calc((100cqw-min(88cqw,26rem))/2)] active:cursor-grabbing'
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
              className="aspect-[2/1] w-full rounded-2xl bg-muted object-cover"
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
  qty,
  onQty,
  onPreview,
}: {
  item: MenuItem;
  qty: number;
  onQty: (n: number) => void;
  onPreview: () => void;
}) {
  return (
    <li
      id={`dish-${item.id}`}
      className="relative -mx-2 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 rounded-xl border-b px-2 py-4 transition-colors duration-[120ms] last:border-b-0 hover:bg-fill-hover/60 active:bg-fill-press/40 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
    >
      {/* Stretched button makes the entire dish card clickable while keeping quick-add controls separate */}
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Lihat detail ${item.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:outline-offset-[-2px]"
      />
      <MenuThumb
        src={item.imageUrl}
        type={item.type}
        alt={item.name}
        className="pointer-events-none"
      />
      <div className="pointer-events-none grid min-w-0 content-between gap-2">
        <div className="grid gap-1">
          <h3 className="type-label-m">{item.name}</h3>
          {item.description && (
            <p className="line-clamp-1 type-body-s text-ink-soft">
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

type DraftPart = { name: string; qty: Record<string, number> };
const draftPart = (): DraftPart => ({ name: '', qty: {} });

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
  const nameRef = useRef<HTMLInputElement>(null);

  // Split bill: step 2 of the sheet, only when the switch is on
  const [split, setSplit] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<SplitMode>('item');
  const [parts, setParts] = useState<DraftPart[]>(() => [draftPart(), draftPart()]);
  const [active, setActive] = useState(0);
  const [people, setPeople] = useState(2);
  const [evenNames, setEvenNames] = useState<string[]>([]);

  // Close the sheet when the last item is removed
  useEffect(() => {
    if (open && lines.length === 0 && !busy) onOpenChange(false);
  }, [open, lines.length, busy, onOpenChange]);
  // Every visit starts at step 1, with the split as it was left
  useEffect(() => {
    if (!open) setStep(1);
  }, [open]);

  const units = lines.reduce((n, l) => n + l.quantity, 0);
  const maxParts = Math.min(MAX_PARTS, units);

  // Each part's quantities, capped at what's in the cart (the cart can change after splitting)
  const assigned = useMemo(() => {
    const left = new Map(lines.map((l) => [l.menuItemId, l.quantity]));
    return parts.map((p) =>
      Object.fromEntries(
        lines.map((l) => {
          const q = Math.min(p.qty[l.menuItemId] ?? 0, left.get(l.menuItemId) ?? 0);
          left.set(l.menuItemId, (left.get(l.menuItemId) ?? 0) - q);
          return [l.menuItemId, q];
        }),
      ),
    );
  }, [parts, lines]);
  const leftOf = (id: string) =>
    (lines.find((l) => l.menuItemId === id)?.quantity ?? 0) -
    assigned.reduce((n, a) => n + (a[id] ?? 0), 0);
  const partAmount = (i: number) =>
    lines.reduce((n, l) => n + (assigned[i]?.[l.menuItemId] ?? 0) * (byId.get(l.menuItemId)?.price ?? 0), 0);
  const partLabel = (i: number) =>
    (i === 0 ? parts[0].name.trim() || name.trim() : parts[i].name.trim()) || `Bagian ${i + 1}`;
  const evenAmounts = splitEvenly(total, people);
  const unassigned = lines.filter((l) => leftOf(l.menuItemId) > 0);
  const emptyPart = parts.findIndex((_, i) => !Object.values(assigned[i] ?? {}).some((q) => q > 0));

  const myAmount = mode === 'item' ? partAmount(0) : evenAmounts[0];
  const blocked =
    !split || step === 1
      ? ''
      : mode === 'item' && unassigned.length
        ? 'Bagikan semua item dulu'
        : mode === 'item' && emptyPart >= 0
          ? `${partLabel(emptyPart)} belum punya item`
          : '';

  const setPartQty = (id: string, q: number) =>
    setParts((ps) => ps.map((p, i) => (i === active ? { ...p, qty: { ...p.qty, [id]: q } } : p)));
  const addPart = () => {
    setParts((ps) => [...ps, draftPart()]);
    setActive(parts.length);
  };
  const removePart = () => {
    setParts((ps) => ps.filter((_, i) => i !== active));
    setActive((a) => a - 1);
  };

  const checkName = () => {
    if (name.trim()) return true;
    setNameError('Isi nama Anda supaya staf bisa memanggil saat pesanan siap.');
    nameRef.current?.focus();
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!table || busy) return;
    if (split && step === 1) {
      if (!checkName()) return;
      if (units < 2) setMode('even'); // one item can't be split per item
      setStep(2);
      return;
    }
    if (!checkName() || blocked) return;
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
        split: !split
          ? undefined
          : mode === 'even'
            ? {
                mode,
                parts: evenAmounts.map((_, i) => ({
                  name: (i === 0 ? evenNames[0]?.trim() || name.trim() : evenNames[i]?.trim()) || undefined,
                  paymentMethod: i === 0 ? payment : undefined,
                })),
              }
            : {
                mode,
                parts: parts.map((p, i) => ({
                  name: (i === 0 ? p.name.trim() || name.trim() : p.name.trim()) || undefined,
                  paymentMethod: i === 0 ? payment : undefined,
                  items: lines
                    .map((l) => ({ menuItemId: l.menuItemId, quantity: assigned[i][l.menuItemId] ?? 0 }))
                    .filter((it) => it.quantity > 0),
                })),
              },
      });
      recentOrders.add(data.orderId);
      onPlaced();
      const to = `/pesanan?order_id=${data.orderId}`;
      if (payment === 'cashless' && (data.snapToken || data.redirectUrl)) {
        setBusy('redirecting');
        // The open sheet traps focus and clicks, which would leave the Midtrans popup unusable
        onOpenChange(false);
        const result = await openSnap(data.snapToken, data.redirectUrl, to);
        if (result === 'redirected') return;
        // The webhook may still be on its way; ask Midtrans so the next page is already up to date
        await api.checkOrderPayment(data.orderId).catch(() => null);
      }
      navigate(to);
    } catch (err) {
      toast.error('Pesanan belum terkirim', { description: errorMessage(err) });
      setBusy('');
    }
  };

  const payChoice = (compact: boolean) => (
    <fieldset className="grid gap-2">
      <legend className="mb-2 type-label-s">{split ? 'Pembayaran bagian Anda' : 'Pembayaran'}</legend>
      <RadioGroup
        value={payment}
        onValueChange={(v) => setPayment(v as PaymentMethod)}
        className={cn('gap-2', compact && 'grid-cols-2')}
      >
        {(
          [
            ['cashless', 'Non-tunai', 'QRIS, e-wallet, kartu, atau transfer bank', 'wallet'],
            ['cash', 'Tunai', 'Bayar di kasir, lalu pesanan mulai dibuat', 'cash'],
          ] as const
        ).map(([value, title, desc, icon]) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-strong p-3 transition-colors hover:bg-fill-hover has-data-checked:border-transparent has-data-checked:bg-secondary has-data-checked:shadow-[inset_0_0_0_2px_var(--ds-selected)]"
          >
            {!compact && (
              <span className="grid size-10 place-items-center rounded-full bg-muted text-ink-soft">
                <Icon name={icon} className="size-5" />
              </span>
            )}
            <span className="grid flex-1">
              <span className="type-label-s whitespace-nowrap">{title}</span>
              {!compact && <span className="type-body-xs text-ink-soft">{desc}</span>}
            </span>
            <RadioGroupItem value={value} aria-label={title} />
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );

  const submitLabel = busy
    ? busy === 'redirecting'
      ? 'Membuka pembayaran…'
      : 'Mengirim pesanan…'
    : split && step === 1
      ? 'Lanjut: bagi tagihan'
      : blocked ||
        (split
          ? payment === 'cash'
            ? `Pesan, bayar ${rupiah(myAmount)} di kasir`
            : `Pesan dan bayar ${rupiah(myAmount)}`
          : payment === 'cash'
            ? 'Pesan, bayar di kasir'
            : 'Pesan dan bayar');

  return (
    <Sheet open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <SheetContent side="bottom" className="mx-auto max-w-[30rem] gap-0 overflow-y-auto md:max-w-xl">
        {step === 1 ? (
          <SheetHeader className="pb-3">
            <SheetTitle>Pesanan Anda</SheetTitle>
            <SheetDescription>{table ? `Diantar ke meja ${table}` : 'Nomor meja belum terbaca'}</SheetDescription>
          </SheetHeader>
        ) : (
          <SheetHeader className="flex-row items-center gap-1 pb-3 pl-2">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setStep(1)} aria-label="Kembali ke pesanan">
              <Icon name="back" className="size-5" />
            </Button>
            <div className="grid">
              <SheetTitle>Bagi tagihan</SheetTitle>
              <SheetDescription>Langkah 2 dari 2 · total {rupiah(total)}</SheetDescription>
            </div>
          </SheetHeader>
        )}

        <form id="checkout" onSubmit={submit} className="grid gap-5 px-5 pb-2">
          {step === 1 ? (
            <>
              <ul className="grid">
                {lines.map((l) => {
                  const m = byId.get(l.menuItemId);
                  if (!m) return null;
                  return (
                    <li key={l.menuItemId} className="grid gap-2 border-b py-3 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <MenuThumb src={m.imageUrl} type={m.type} alt="" className="size-12 rounded-md" />
                        <div className="grid min-w-0 flex-1">
                          <span className="type-label-s">{m.name}</span>
                          <span className="type-body-s text-ink-soft tabular-nums">{rupiah(m.price * l.quantity)}</span>
                        </div>
                        <Stepper value={l.quantity} onChange={(n) => onQty(m.id, n)} name={m.name} />
                      </div>
                      <label className="relative block">
                        <span className="sr-only">Catatan untuk {m.name}</span>
                        <Icon
                          name="notes"
                          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
                        />
                        <Input
                          value={l.note}
                          onChange={(e) => onNote(m.id, e.target.value)}
                          placeholder="Catatan, mis. tidak pedas"
                          maxLength={200}
                          className="h-10 pl-10 text-sm"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>

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
                  Nomor HP <span className="font-normal text-ink-faint">(opsional)</span>
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

              {lines.length > 0 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-background p-3">
                  <span className="grid flex-1">
                    <span className="type-label-s">Pisah bill</span>
                    <span className="type-body-xs text-ink-soft">
                      Tiap orang bayar bagiannya sendiri. Pembagian dan cara bayar diatur di langkah berikutnya.
                    </span>
                  </span>
                  <Switch checked={split} onCheckedChange={setSplit} />
                </label>
              )}

              {!split && payChoice(false)}
            </>
          ) : (
            <>
              <div role="radiogroup" aria-label="Cara membagi" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
                {(
                  [
                    ['item', 'Per item'],
                    ['even', 'Dibagi rata'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={mode === value}
                    disabled={value === 'item' && units < 2}
                    onClick={() => setMode(value)}
                    className="min-h-9 rounded-full type-label-s text-ink-soft transition-colors duration-[120ms] disabled:opacity-50 aria-checked:bg-surface aria-checked:text-ink aria-checked:shadow-ds-1"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === 'item' ? (
                <>
                  <div role="tablist" aria-label="Bagian" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
                    {parts.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === active}
                        onClick={() => setActive(i)}
                        className="grid min-w-20 shrink-0 rounded-lg border border-line-strong px-3 py-2 text-left transition-colors hover:bg-fill-hover aria-selected:border-transparent aria-selected:bg-secondary aria-selected:shadow-[inset_0_0_0_2px_var(--ds-selected)]"
                      >
                        <span className="max-w-28 truncate type-label-s">{partLabel(i)}</span>
                        <span className="type-body-xs text-ink-soft tabular-nums">{rupiah(partAmount(i))}</span>
                      </button>
                    ))}
                    {parts.length < maxParts && (
                      <Button type="button" variant="outline" className="h-auto min-h-12 shrink-0 rounded-lg" onClick={addPart} aria-label="Tambah bagian">
                        <Icon name="plus" />
                      </Button>
                    )}
                  </div>

                  <Field>
                    <FieldLabel htmlFor="part-name">
                      Nama bagian {active + 1} <span className="font-normal text-ink-faint">(opsional)</span>
                    </FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="part-name"
                        value={parts[active].name}
                        maxLength={30}
                        onChange={(e) => setParts((ps) => ps.map((p, i) => (i === active ? { ...p, name: e.target.value } : p)))}
                        placeholder={active === 0 ? name.trim() || 'Anda' : 'mis. Citra'}
                      />
                      {active > 0 && parts.length > 2 && (
                        <Button type="button" variant="ghost" className="shrink-0 px-3 text-danger-ink hover:bg-danger-tint-hover" onClick={removePart}>
                          Hapus
                        </Button>
                      )}
                    </div>
                  </Field>

                  {unassigned.length > 0 && (
                    <p role="status" className="flex items-start gap-2 rounded-lg bg-warning-tint px-3 py-2.5 type-body-s text-warning-ink">
                      <Icon name="info" className="mt-0.5" />
                      <span>
                        <span className="type-label-s">Belum dibagi:</span>{' '}
                        {unassigned.map((l) => `${leftOf(l.menuItemId)}× ${byId.get(l.menuItemId)?.name}`).join(', ')}
                      </span>
                    </p>
                  )}

                  <ul className="grid">
                    {lines.map((l) => {
                      const m = byId.get(l.menuItemId);
                      if (!m) return null;
                      const mine = assigned[active]?.[l.menuItemId] ?? 0;
                      const left = leftOf(l.menuItemId);
                      const holders = parts.map((_, i) => i).filter((i) => i !== active && (assigned[i]?.[l.menuItemId] ?? 0) > 0);
                      return (
                        <li key={l.menuItemId} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
                          <MenuThumb src={m.imageUrl} type={m.type} alt="" className="size-10 rounded-md" />
                          <span className="grid min-w-0 flex-1">
                            <span className="type-label-s">{m.name}</span>
                            <span className={cn('type-body-xs', left ? 'type-label-xs text-warning-ink' : 'text-ink-faint')}>
                              {left
                                ? `Sisa ${left}`
                                : mine
                                  ? 'Semua sudah dibagi'
                                  : `Di bagian ${holders.map(partLabel).join(', ')}`}
                            </span>
                          </span>
                          <Stepper value={mine} max={mine + left} removes={false} onChange={(n) => setPartQty(l.menuItemId, n)} name={m.name} />
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="type-label-s">Jumlah orang</span>
                    <Stepper value={people} min={2} max={MAX_PARTS} removes={false} onChange={setPeople} name="orang" />
                  </div>
                  <fieldset className="grid gap-2">
                    <legend className="mb-2 type-label-s">
                      Nama tiap bagian <span className="font-normal text-ink-faint">(opsional)</span>
                    </legend>
                    {evenAmounts.map((amount, i) => (
                      <label key={i} className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted type-label-xs text-ink-soft">{i + 1}</span>
                        <span className="sr-only">Nama bagian {i + 1}</span>
                        <Input
                          value={evenNames[i] ?? ''}
                          maxLength={30}
                          onChange={(e) =>
                            setEvenNames((ns) => {
                              const next = [...ns];
                              next[i] = e.target.value;
                              return next;
                            })
                          }
                          placeholder={i === 0 ? name.trim() || 'Anda' : `Bagian ${i + 1}`}
                          className="h-10"
                        />
                        <span className="min-w-20 text-right type-label-s tabular-nums">{rupiah(amount)}</span>
                      </label>
                    ))}
                    {evenAmounts[0] !== evenAmounts[1] && (
                      <p className="type-body-xs text-ink-faint">
                        Bagian 1 menanggung sisa pembulatan {rupiah(evenAmounts[0] - evenAmounts[1])}.
                      </p>
                    )}
                  </fieldset>
                </>
              )}

              {payChoice(true)}
              <p className="type-body-xs text-ink-soft">
                Bagian lain memilih cara bayarnya sendiri lewat tautan yang Anda bagikan setelah memesan.
              </p>
            </>
          )}
        </form>

        <SheetFooter className="sticky bottom-0 gap-2 border-t bg-popover">
          {split && step === 2 ? (
            <div className="flex items-baseline justify-between">
              <span className="type-body-s text-ink-soft">Bagian Anda · {mode === 'item' ? partLabel(0) : evenNames[0]?.trim() || name.trim()}</span>
              <span className="type-label-l tabular-nums">{rupiah(myAmount)}</span>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <span className="type-body-s text-ink-soft">Total</span>
              <span className="type-label-l tabular-nums">{rupiah(total)}</span>
            </div>
          )}
          {!table && (
            <FieldDescription className="text-warning-ink">Pindai kode QR di meja untuk mengirim pesanan.</FieldDescription>
          )}
          <Button type="submit" form="checkout" size="lg" disabled={!table || !!busy || lines.length === 0 || !!blocked}>
            {busy && <Spinner label={false} />}
            {submitLabel}
            {split && step === 1 && !busy && <Icon name="next" />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
