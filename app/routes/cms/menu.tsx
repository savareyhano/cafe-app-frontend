import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

import type { Route } from "./+types/menu";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api, errorMessage } from "~/lib/api";
import { rupiah, TYPE_LABEL } from "~/lib/format";
import { ADMIN, onAuthError, requireUser } from "~/lib/session";
import type { MenuItem } from "~/lib/types";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Icon } from "~/components/icon";
import { ImagePicker, imageError } from "~/components/image-picker";
import { MenuThumb } from "~/components/menu-thumb";
import { Pager } from "~/components/pager";
import { SearchInput } from "~/components/search-input";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { Spinner } from "~/components/ui/spinner";

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
  const res = await api.menuItems({
    page: Number(sp.get("hal")) || 1,
    perPage: 20,
    search: sp.get("cari") ?? "",
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });
  return { items: res.data, pagination: res.pagination };
}

export default function MenuPage({ loaderData }: Route.ComponentProps) {
  const { items, pagination } = loaderData;
  const [sp, setSp] = useSearchParams();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);

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

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteMenuItem(deleting.id);
      toast.success(`${deleting.name} dihapus dari menu`);
      setDeleting(null);
      revalidator.revalidate();
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Menu gagal dihapus", { description: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CmsPage
      title="Menu"
      actions={
        <Button className={onBand} size="sm" onClick={() => setEditing("new")}>
          <Icon name="plus" />
          Tambah menu
        </Button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,24rem)_12rem]">
        <SearchInput defaultValue={sp.get("cari") ?? ""} onSearch={(q) => setParam("cari", q)} placeholder="Cari nama menu" />
        <NativeSelect
          size="sm"
          aria-label="Urutkan"
          value={sp.get("urut") ?? "terbaru"}
          onChange={(e) => setParam("urut", e.target.value === "terbaru" ? "" : e.target.value)}
        >
          {Object.entries(SORTS).map(([k, s]) => (
            <NativeSelectOption key={k} value={k}>
              {s.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {items.length === 0 ? (
        <Empty className="rounded-2xl bg-surface shadow-ds-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="food-menu" />
            </EmptyMedia>
            <EmptyTitle>{sp.get("cari") ? "Tidak ada menu yang cocok" : "Menu masih kosong"}</EmptyTitle>
            <EmptyDescription>
              {sp.get("cari")
                ? "Coba kata lain atau hapus pencarian."
                : "Tambahkan menu pertama. Pelanggan baru bisa memesan setelah ada menu."}
            </EmptyDescription>
          </EmptyHeader>
          {!sp.get("cari") && (
            <Button onClick={() => setEditing("new")}>
              <Icon name="plus" />
              Tambah menu
            </Button>
          )}
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Menu</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="w-px text-right">
                <span className="sr-only">Tindakan</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex min-w-56 items-center gap-3">
                    <MenuThumb src={m.imageUrl} type={m.type} alt="" className="size-12 rounded-md" />
                    <div className="grid min-w-0">
                      <span className="type-label-s">{m.name}</span>
                      {m.description && <span className="line-clamp-1 max-w-md text-ink-soft">{m.description}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="type-body-s">{TYPE_LABEL[m.type]}</span>
                </TableCell>
                <TableCell className="text-right type-label-s whitespace-nowrap tabular-nums">{rupiah(m.price)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(m)} aria-label={`Ubah ${m.name}`} title="Ubah">
                    <Icon name="edit" className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-danger-ink hover:bg-danger-tint-hover"
                    onClick={() => setDeleting(m)}
                    aria-label={`Hapus ${m.name}`}
                    title="Hapus"
                  >
                    <Icon name="delete" className="size-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager pagination={pagination} onPage={(p) => setParam("hal", p === 1 ? "" : String(p))} noun="menu" />

      <MenuDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => (setEditing(null), revalidator.revalidate())}
      />
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

const schema = z.object({
  name: z.string().trim().min(1, "Isi nama menu.").max(255, "Maksimal 255 karakter."),
  type: z.enum(["food", "drink"]),
  price: z
    .string()
    .trim()
    .min(1, "Isi harga.")
    .refine((v) => /^\d+$/.test(v.replace(/\./g, "")) && Number(v.replace(/\./g, "")) >= 1, "Harga berupa angka bulat, minimal 1."),
  description: z.string().max(1000, "Maksimal 1000 karakter."),
  image: z.custom<File | null>().refine((f) => !imageError(f), { message: "Gambar tidak valid." }),
});
type Values = z.infer<typeof schema>;

function MenuDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MenuItem | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = item && item !== "new" ? item : null;
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Ubah ${editing.name}` : "Tambah menu"}</DialogTitle>
          <DialogDescription>Nama, harga, dan foto tampil di halaman pesan pelanggan.</DialogDescription>
        </DialogHeader>
        {item && <MenuForm key={editing?.id ?? "new"} item={editing} onCancel={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function MenuForm({ item, onCancel, onSaved }: { item: MenuItem | null; onCancel: () => void; onSaved: () => void }) {
  const navigate = useNavigate();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? "",
      type: item?.type ?? "food",
      price: item ? String(item.price) : "",
      description: item?.description ?? "",
      image: null,
    },
  });

  const submit = async (v: Values) => {
    const fd = new FormData();
    fd.set("name", v.name);
    fd.set("type", v.type);
    fd.set("price", v.price.replace(/\./g, ""));
    if (item || v.description) fd.set("description", v.description);
    if (v.image) fd.set("image", v.image);
    try {
      if (item) await api.updateMenuItem(item.id, fd);
      else await api.addMenuItem(fd);
      toast.success(item ? "Perubahan disimpan" : `${v.name} ditambahkan ke menu`);
      onSaved();
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Menu gagal disimpan", { description: errorMessage(e) });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Controller
          name="image"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Foto</FieldLabel>
              <ImagePicker
                value={field.value}
                currentUrl={item?.imageUrl}
                onChange={(f) => {
                  field.onChange(f);
                  const err = imageError(f);
                  err ? form.setError("image", { message: err }) : form.clearErrors("image");
                }}
                invalid={fieldState.invalid}
                label="Pilih foto menu"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        <FieldGroup className="gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="menu-name">Nama</FieldLabel>
                <Input {...field} id="menu-name" aria-invalid={fieldState.invalid} placeholder="mis. Es Kopi Susu" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
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
            name="type"
            control={form.control}
            render={({ field }) => (
              <fieldset className="grid gap-2">
                <legend className="mb-2 type-label-s">Kategori</legend>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                  {(["food", "drink"] as const).map((t) => (
                    <label key={t} className="flex min-h-10 cursor-pointer items-center gap-2 type-body-m">
                      <RadioGroupItem value={t} />
                      {TYPE_LABEL[t]}
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
            )}
          />
        </FieldGroup>
      </div>
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner label={false} />}
          {item ? "Simpan perubahan" : "Tambah menu"}
        </Button>
      </DialogFooter>
    </form>
  );
}
