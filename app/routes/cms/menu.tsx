import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

import type { Route } from "./+types/menu";
import { CmsPage } from "~/components/cms-shell";
import { api, errorMessage, fetchAll } from "~/lib/api";
import { rupiah, TYPE_LABEL } from "~/lib/format";
import { LABEL_STYLE, LABELS, useMenuDemo, type Category, type Label, type MenuDemo } from "~/lib/menu-demo";
import { ADMIN, onAuthError, requireUser } from "~/lib/session";
import type { MenuItem, MenuType } from "~/lib/types";
import { cn } from "~/lib/utils";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Icon, type IconName } from "~/components/icon";
import { ImagePicker, imageError } from "~/components/image-picker";
import { MenuThumb } from "~/components/menu-thumb";
import { SearchInput } from "~/components/search-input";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Spinner } from "~/components/ui/spinner";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

const SORTS = {
  terbaru: { sortBy: "createdAt", sortOrder: "desc", label: "Terbaru" },
  nama: { sortBy: "name", sortOrder: "asc", label: "Nama A–Z" },
  termurah: { sortBy: "price", sortOrder: "asc", label: "Harga termurah" },
  termahal: { sortBy: "price", sortOrder: "desc", label: "Harga termahal" },
} as const;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(ADMIN);
  const sp = new URL(request.url).searchParams;
  const sort = SORTS[(sp.get("urut") as keyof typeof SORTS) ?? "terbaru"] ?? SORTS.terbaru;
  // The whole menu at once: the category cards count every item, and a cafe menu is small
  const items = await fetchAll((page) =>
    api.menuItems({ page, perPage: 100, search: sp.get("cari") ?? "", sortBy: sort.sortBy, sortOrder: sort.sortOrder }),
  );
  return { items };
}

/** Category filter: "all", a category id, or a label. */
type Filter = "all" | `cat:${string}` | `label:${Label}`;

/** The form panel sits beside the grid from lg up; below that it opens as a dialog. */
function useWide() {
  const q = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export default function MenuPage({ loaderData }: Route.ComponentProps) {
  const { items } = loaderData;
  const [sp, setSp] = useSearchParams();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const demo = useMenuDemo();
  const wide = useWide();
  const [filter, setFilter] = useState<Filter>("all");
  // null: nothing open on phones; on wide screens the panel then shows a blank "Tambah menu" form
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);

  const setParam = (key: string, value: string) =>
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const inCat = (id: string) => items.filter((m) => demo.categoryOf(m) === id);
  const withLabel = (l: Label) => items.filter((m) => demo.labelOf(m.id) === l);
  const shown =
    filter === "all"
      ? items
      : filter.startsWith("cat:")
        ? inCat(filter.slice(4))
        : withLabel(filter.slice(6) as Label);
  const heading =
    filter === "all"
      ? "Semua menu"
      : filter.startsWith("cat:")
        ? (demo.categories.find((c) => `cat:${c.id}` === filter)?.name ?? "Menu")
        : LABELS[filter.slice(6) as Label];

  const openForm = (m: MenuItem | "new") => (setEditing(m), setFormKey((k) => k + 1));
  const closeForm = () => (setEditing(null), setFormKey((k) => k + 1));
  const saved = () => (closeForm(), revalidator.revalidate());

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteMenuItem(deleting.id);
      toast.success(`${deleting.name} dihapus dari menu`);
      if (editing !== "new" && editing?.id === deleting.id) closeForm();
      setDeleting(null);
      revalidator.revalidate();
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Menu gagal dihapus", { description: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const formItem = editing && editing !== "new" ? editing : null;
  const form = (
    <MenuForm
      key={`${formItem?.id ?? "new"}-${formKey}`}
      item={formItem}
      demo={demo}
      defaultCategory={filter.startsWith("cat:") ? filter.slice(4) : undefined}
      onCancel={closeForm}
      onSaved={saved}
    />
  );

  return (
    <CmsPage
      title="Menu"
      lead="Kelola menu cafe Anda"
      actions={
        <Button size="sm" onClick={() => openForm("new")}>
          <Icon name="plus" />
          Tambah menu
        </Button>
      }
    >
      <p className="flex items-start gap-2 rounded-xl bg-info-tint px-4 py-3 type-body-s text-info-ink">
        <Icon name="info" className="mt-0.5 size-4" />
        <span>
          <b>Kategori, label, dan tombol tersedia masih contoh tampilan:</b> hanya tersimpan di browser ini dan belum
          terlihat pelanggan. Nama, harga, foto, deskripsi, dan Makanan/Minuman tersimpan sungguhan.
        </span>
      </p>

      <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-3">
        <FilterCard active={filter === "all"} onClick={() => setFilter("all")} icon="food-menu" name="Semua" count={items.length} />
        {demo.categories.map((c) => {
          const list = inCat(c.id);
          return (
            <FilterCard
              key={c.id}
              active={filter === `cat:${c.id}`}
              onClick={() => setFilter(`cat:${c.id}`)}
              thumb={list.find((m) => m.imageUrl) ?? list[0]}
              type={c.type}
              name={c.name}
              count={list.length}
            />
          );
        })}
        {(["best", "promo"] as const).map((l) => (
          <FilterCard
            key={l}
            active={filter === `label:${l}`}
            onClick={() => setFilter(`label:${l}`)}
            icon={l === "best" ? "rating" : "promo"}
            name={LABELS[l]}
            count={withLabel(l).length}
          />
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="menu-list" className="grid gap-4 rounded-2xl bg-surface p-4 shadow-ds-1 sm:p-5 dark:ring-1 dark:ring-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="menu-list" className="type-label-l">
              {heading} <span className="text-ink-faint tabular-nums">({shown.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <SearchInput defaultValue={sp.get("cari") ?? ""} onSearch={(q) => setParam("cari", q)} placeholder="Cari nama menu" />
              <NativeSelect
                size="sm"
                aria-label="Urutkan"
                className="w-44"
                value={sp.get("urut") ?? "terbaru"}
                onChange={(e) => setParam("urut", e.target.value === "terbaru" ? "" : e.target.value)}
              >
                {Object.entries(SORTS).map(([k, s]) => (
                  <NativeSelectOption key={k} value={k}>
                    Urutkan: {s.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          {shown.length === 0 ? (
            <Empty className="rounded-xl bg-muted/50">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Icon name="food-menu" />
                </EmptyMedia>
                {sp.get("cari") ? (
                  <EmptyTitle>Tidak ada yang cocok dengan “{sp.get("cari")}”</EmptyTitle>
                ) : items.length === 0 ? (
                  <>
                    <EmptyTitle>Menu masih kosong</EmptyTitle>
                    <EmptyDescription>Tambahkan menu pertama. Pelanggan baru bisa memesan setelah ada menu.</EmptyDescription>
                  </>
                ) : (
                  <EmptyTitle>Belum ada menu di {heading}</EmptyTitle>
                )}
              </EmptyHeader>
              {sp.get("cari") ? (
                <Button variant="outline" size="sm" onClick={() => setParam("cari", "")}>
                  Hapus pencarian
                </Button>
              ) : (
                <Button size="sm" onClick={() => openForm("new")}>
                  <Icon name="plus" />
                  Tambah menu
                </Button>
              )}
            </Empty>
          ) : (
            // Phones: a list with a small photo. From sm up: a grid of photo cards.
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {shown.map((m) => (
                <MenuCard
                  key={m.id}
                  item={m}
                  label={demo.labelOf(m.id)}
                  off={demo.isOff(m.id)}
                  editing={formItem?.id === m.id}
                  onToggle={() => demo.toggleOff(m.id)}
                  onEdit={() => openForm(m)}
                  onDelete={() => setDeleting(m)}
                />
              ))}
            </ul>
          )}
        </section>

        {wide && (
          <aside
            aria-labelledby="menu-form-title"
            className="sticky top-20 grid gap-4 rounded-2xl bg-surface p-5 shadow-ds-1 dark:ring-1 dark:ring-border"
          >
            <h2 id="menu-form-title" className="type-label-l">
              {formItem ? `Ubah ${formItem.name}` : "Tambah menu"}
            </h2>
            {form}
          </aside>
        )}
      </div>

      <CategoryManager demo={demo} items={items} />

      {!wide && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && closeForm()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{formItem ? `Ubah ${formItem.name}` : "Tambah menu"}</DialogTitle>
              <DialogDescription>Nama, harga, dan foto tampil di halaman pesan pelanggan.</DialogDescription>
            </DialogHeader>
            {editing && form}
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Hapus ${deleting?.name ?? "menu"}?`}
        description="Menu hilang dari halaman pesan. Pesanan lama tetap tersimpan. Banner yang tertaut ke menu ini perlu Anda periksa."
        confirmLabel="Hapus menu"
        destructive
        busy={busy}
        onConfirm={remove}
      />
    </CmsPage>
  );
}

function FilterCard({
  active,
  onClick,
  name,
  count,
  icon,
  thumb,
  type,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  count: number;
  icon?: IconName;
  thumb?: MenuItem;
  type?: MenuType;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface py-2 pr-5 pl-2 text-left shadow-ds-1 transition-colors duration-[120ms] hover:bg-fill-hover aria-pressed:bg-[color-mix(in_srgb,var(--ds-selected)_12%,var(--ds-bg-surface))] aria-pressed:shadow-[inset_0_0_0_2px_var(--ds-selected)] dark:ring-1 dark:ring-border"
    >
      {icon ? (
        <span className="grid size-12 place-items-center rounded-xl text-[var(--ds-selected)]">
          <Icon name={icon} className="size-6" />
        </span>
      ) : (
        <MenuThumb src={thumb?.imageUrl} type={type} alt="" className="size-12 rounded-xl" />
      )}
      <span className="grid">
        <span className="type-label-s whitespace-nowrap">{name}</span>
        <span className="type-body-xs text-ink-faint tabular-nums">{count}</span>
      </span>
    </button>
  );
}

function MenuCard({
  item: m,
  label,
  off,
  editing,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  label?: Label;
  off: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-2xl border border-line p-2.5 sm:grid-cols-1",
        editing && "border-transparent shadow-[inset_0_0_0_2px_var(--ds-selected)]",
      )}
    >
      <div className="relative">
        <MenuThumb
          src={m.imageUrl}
          type={m.type}
          alt=""
          className={cn("size-18 rounded-xl sm:aspect-[4/3] sm:size-auto sm:w-full", off && "opacity-50 grayscale")}
        />
        {label && (
          <span
            className={cn(
              "absolute top-2 left-2 hidden items-center gap-1 rounded-full px-2 py-0.5 type-label-xs sm:flex",
              LABEL_STYLE[label].className,
            )}
          >
            <Icon name={LABEL_STYLE[label].icon} className="size-3.5" />
            {LABELS[label]}
          </span>
        )}
      </div>
      <div className="grid min-w-0 content-between gap-2 sm:px-1">
        <div className="grid gap-0.5">
          <span className="truncate type-label-m">{m.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 type-body-s tabular-nums">
            {rupiah(m.price)}
            {off && <Badge size="sm">Habis</Badge>}
            {label && (
              <Badge size="sm" className={cn("sm:hidden", LABEL_STYLE[label].className)}>
                {LABELS[label]}
              </Badge>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={!off} onCheckedChange={onToggle} aria-label={`${m.name} tersedia`} />
          <span className="flex-1" />
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Ubah ${m.name}`}>
            <Icon name="edit" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Tindakan lain untuk ${m.name}`}>
                <Icon name="overflow-vertical" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Icon name="edit" />
                Ubah
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Icon name="delete" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, "Isi nama menu.").max(255, "Maksimal 255 karakter."),
  category: z.string().min(1, "Pilih kategori."),
  label: z.enum(["best", "promo", "new"]).nullable(),
  price: z
    .string()
    .trim()
    .min(1, "Isi harga.")
    .refine((v) => /^\d+$/.test(v.replace(/\./g, "")) && Number(v.replace(/\./g, "")) >= 1, "Harga berupa angka bulat, minimal 1."),
  description: z.string().max(1000, "Maksimal 1000 karakter."),
  image: z.custom<File | null>().refine((f) => !imageError(f), { message: "Gambar tidak valid." }),
});
type Values = z.infer<typeof schema>;

function MenuForm({
  item,
  demo,
  defaultCategory,
  onCancel,
  onSaved,
}: {
  item: MenuItem | null;
  demo: MenuDemo;
  defaultCategory?: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? "",
      category: (item ? demo.categoryOf(item) : defaultCategory) ?? demo.categories[0]?.id ?? "",
      label: item ? (demo.labelOf(item.id) ?? null) : null,
      price: item ? String(item.price) : "",
      description: item?.description ?? "",
      image: null,
    },
  });

  const submit = async (v: Values) => {
    // The backend only knows food/drink; the category decides which one is saved
    const type = demo.categories.find((c) => c.id === v.category)?.type ?? "food";
    const fd = new FormData();
    fd.set("name", v.name);
    fd.set("type", type);
    fd.set("price", v.price.replace(/\./g, ""));
    if (item || v.description) fd.set("description", v.description);
    if (v.image) fd.set("image", v.image);
    try {
      const id = item ? (await api.updateMenuItem(item.id, fd), item.id) : (await api.addMenuItem(fd)).data?.menuItemId;
      if (id) demo.assign(id, v.category, v.label);
      toast.success(item ? "Perubahan disimpan" : `${v.name} ditambahkan ke menu`);
      onSaved();
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Menu gagal disimpan", { description: errorMessage(e) });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="grid gap-4" noValidate>
      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Foto</FieldLabel>
            <ImagePicker
              value={field.value}
              currentUrl={item?.imageUrl}
              aspect="aspect-[16/9]"
              onChange={(f) => {
                field.onChange(f);
                const err = imageError(f);
                err ? form.setError("image", { message: err }) : form.clearErrors("image");
              }}
              invalid={fieldState.invalid}
              label="Unggah foto (JPG, PNG, atau WebP, maks. 4 MB)"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="menu-name">Nama menu</FieldLabel>
            <Input {...field} id="menu-name" aria-invalid={fieldState.invalid} placeholder="mis. Ayam Geprek" />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="category"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="menu-category">Kategori</FieldLabel>
            <NativeSelect {...field} id="menu-category" aria-invalid={fieldState.invalid}>
              {demo.categories.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.name} ({TYPE_LABEL[c.type]})
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="label"
        control={form.control}
        render={({ field }) => (
          <fieldset className="grid gap-2">
            <legend className="mb-2 type-label-s">
              Label <span className="font-normal text-ink-faint">(opsional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LABELS) as Label[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={field.value === l}
                  onClick={() => field.onChange(field.value === l ? null : l)}
                  className="min-h-9 rounded-full border border-line-strong px-4 type-label-xs text-ink-soft transition-colors duration-[120ms] hover:bg-fill-hover aria-pressed:border-transparent aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                >
                  {LABELS[l]}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      />
      <Controller
        name="price"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="menu-price">Harga</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 type-body-m text-ink-soft">Rp</span>
              <Input
                {...field}
                id="menu-price"
                inputMode="numeric"
                aria-invalid={fieldState.invalid}
                className="pl-12 tabular-nums"
                placeholder="25000"
                onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="menu-desc">
              Deskripsi <span className="font-normal text-ink-faint">(opsional)</span>
            </FieldLabel>
            <Textarea {...field} id="menu-desc" aria-invalid={fieldState.invalid} placeholder="Bahan utama, rasa, atau ukuran porsi" />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner label={false} />}
          {item ? "Simpan perubahan" : "Simpan menu"}
        </Button>
        {(item || form.formState.isDirty) && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}

/** Category cards with their counts, plus adding, renaming and removing categories. */
function CategoryManager({ demo, items }: { demo: MenuDemo; items: MenuItem[] }) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [removing, setRemoving] = useState<Category | null>(null);

  return (
    <section aria-labelledby="cat-title" className="grid gap-4 rounded-2xl bg-surface p-4 shadow-ds-1 sm:p-5 dark:ring-1 dark:ring-border">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="cat-title" className="type-label-l">
          Pengelolaan kategori
        </h2>
        <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
          <Icon name="plus" />
          Tambah kategori
        </Button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {demo.categories.map((c) => {
          const list = items.filter((m) => demo.categoryOf(m) === c.id);
          return (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
              <MenuThumb src={list.find((m) => m.imageUrl)?.imageUrl} type={c.type} alt="" className="size-12 rounded-lg" />
              <span className="grid min-w-0 flex-1">
                <span className="truncate type-label-s">{c.name}</span>
                <span className="type-body-xs text-ink-faint">
                  {list.length} menu · {TYPE_LABEL[c.type]}
                </span>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Tindakan untuk kategori ${c.name}`}>
                    <Icon name="overflow-vertical" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(c)}>
                    <Icon name="edit" />
                    Ubah
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={demo.categories.length === 1}
                    onSelect={() => setRemoving(c)}
                  >
                    <Icon name="delete" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing && editing !== "new" ? `Ubah ${editing.name}` : "Tambah kategori"}</DialogTitle>
            <DialogDescription>Masih contoh tampilan: tersimpan di browser ini saja.</DialogDescription>
          </DialogHeader>
          {editing && (
            <CategoryForm
              key={editing === "new" ? "new" : editing.id}
              category={editing === "new" ? null : editing}
              onSave={(name, type) => {
                if (editing === "new") demo.addCategory(name, type);
                else demo.renameCategory(editing.id, name, type);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Hapus kategori ${removing?.name ?? ""}?`}
        description="Menu di kategori ini tidak ikut terhapus; menu itu pindah ke kategori lain yang paling cocok."
        confirmLabel="Hapus kategori"
        destructive
        onConfirm={() => (removing && demo.removeCategory(removing.id), setRemoving(null))}
      />
    </section>
  );
}

function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category: Category | null;
  onSave: (name: string, type: MenuType) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<MenuType>(category?.type ?? "food");
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError("Isi nama kategori.");
        onSave(name.trim(), type);
      }}
    >
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="cat-name">Nama kategori</FieldLabel>
        <Input
          id="cat-name"
          value={name}
          maxLength={40}
          aria-invalid={!!error}
          onChange={(e) => (setName(e.target.value), setError(""))}
          placeholder="mis. Coffee"
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="cat-type">Disimpan sebagai</FieldLabel>
        <NativeSelect id="cat-type" value={type} onChange={(e) => setType(e.target.value as MenuType)}>
          <NativeSelectOption value="food">Makanan</NativeSelectOption>
          <NativeSelectOption value="drink">Minuman</NativeSelectOption>
        </NativeSelect>
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan</Button>
      </DialogFooter>
    </form>
  );
}
