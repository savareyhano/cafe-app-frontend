import { useEffect, useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/banners";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api, errorMessage, fetchAll } from "~/lib/api";
import { rupiah } from "~/lib/format";
import { ADMIN, onAuthError, requireUser } from "~/lib/session";
import type { Banner, MenuItem } from "~/lib/types";
import { cn } from "~/lib/utils";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Icon } from "~/components/icon";
import { ImagePicker, imageError } from "~/components/image-picker";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Switch } from "~/components/ui/switch";
import { Spinner } from "~/components/ui/spinner";

export async function clientLoader() {
  await requireUser(ADMIN);
  const [banners, menu] = await Promise.all([
    fetchAll((page) => api.banners({ page, perPage: 100, sortBy: "position", sortOrder: "asc" })),
    fetchAll((page) => api.menuItems({ page, perPage: 100, sortBy: "name", sortOrder: "asc" })),
  ]);
  return { banners, menu };
}

export default function Banners({ loaderData }: Route.ComponentProps) {
  const { menu } = loaderData;
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  // Local copy so reorders and toggles show instantly; the server answer replaces it
  const [banners, setBanners] = useState(loaderData.banners);
  useEffect(() => setBanners(loaderData.banners), [loaderData.banners]);
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (title: string, e: unknown) => {
    if (!onAuthError(e, navigate)) toast.error(title, { description: errorMessage(e) });
    revalidator.revalidate();
  };

  // Moves a banner to a chosen position; the ones in between shift by one
  const moveTo = async (from: number, to: number) => {
    if (from === to) return;
    const next = [...banners];
    next.splice(to, 0, ...next.splice(from, 1));
    setBanners(next);
    try {
      await api.reorderBanners(next.map((b) => b.id));
      revalidator.revalidate();
    } catch (e) {
      fail("Urutan gagal disimpan", e);
    }
  };

  const toggle = async (b: Banner, isActive: boolean) => {
    setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, isActive } : x)));
    const fd = new FormData();
    fd.set("isActive", String(isActive));
    try {
      await api.updateBanner(b.id, fd);
      toast.success(isActive ? "Banner ditampilkan" : "Banner disembunyikan");
      revalidator.revalidate();
    } catch (e) {
      fail("Banner gagal diubah", e);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteBanner(deleting.id);
      toast.success("Banner dihapus");
      setDeleting(null);
      revalidator.revalidate();
    } catch (e) {
      fail("Banner gagal dihapus", e);
    } finally {
      setBusy(false);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <CmsPage
      title="Banner"
      actions={
        <Button className={onBand} size="sm" onClick={() => setEditing("new")}>
          <Icon name="plus" />
          Tambah banner
        </Button>
      }
    >
      {banners.length === 0 ? (
        <Empty className="rounded-2xl bg-surface shadow-ds-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="promo" />
            </EmptyMedia>
            <EmptyTitle>Belum ada banner</EmptyTitle>
            <EmptyDescription>Tambahkan gambar promo dan tautkan ke menu agar pelanggan langsung menemukannya.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setEditing("new")}>
            <Icon name="plus" />
            Tambah banner
          </Button>
        </Empty>
      ) : (
        <>
          <p className="type-body-s text-ink-soft">
            {activeCount} dari {banners.length} banner tampil ke pelanggan.
          </p>
          <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {banners.map((b, i) => (
              <li key={b.id} className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-ds-1 dark:ring-1 dark:ring-border">
                <div className="relative">
                  <img
                    src={b.imageUrl}
                    alt=""
                    width={640}
                    height={320}
                    loading="lazy"
                    className={cn("aspect-[2/1] w-full bg-muted object-cover", !b.isActive && "opacity-45")}
                  />
                  <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-surface type-label-s shadow-ds-1 tabular-nums">
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {/* The position picker sits with the banner's own line, so the action row below fits any card width */}
                  <div className="flex items-center gap-3">
                    <p className={cn("min-w-0 flex-1 truncate type-label-s", !b.menuItems && "text-ink-soft")}>
                      {b.menuItems ? `→ ${b.menuItems.name} · ${rupiah(b.menuItems.price)}` : "Tidak ditautkan ke menu"}
                    </p>
                    {banners.length > 1 && (
                      <NativeSelect
                        size="sm"
                        className="w-auto shrink-0"
                        aria-label={`Urutan banner ${i + 1}`}
                        value={i}
                        onChange={(e) => moveTo(i, Number(e.target.value))}
                      >
                        {banners.map((_, n) => (
                          <NativeSelectOption key={n} value={n}>
                            Urutan {n + 1}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1 border-t pt-3">
                    <label className="mr-auto flex min-h-10 cursor-pointer items-center gap-2 type-label-s">
                      <Switch checked={!!b.isActive} onCheckedChange={(v) => toggle(b, v)} aria-label={`Tampilkan banner ${i + 1}`} />
                      <span aria-hidden className={cn(!b.isActive && "text-ink-soft")}>{b.isActive ? "Tampil" : "Disembunyikan"}</span>
                    </label>
                    {/* Edit and delete wrap together, never one alone */}
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="sm" className="px-3" onClick={() => setEditing(b)} aria-label={`Ubah banner ${i + 1}`}>
                        <Icon name="edit" />
                        Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 text-danger-ink hover:bg-danger-tint-hover"
                        onClick={() => setDeleting(b)}
                        aria-label={`Hapus banner ${i + 1}`}
                      >
                        <Icon name="delete" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      <BannerDialog
        banner={editing}
        menu={menu}
        onClose={() => setEditing(null)}
        onSaved={() => (setEditing(null), revalidator.revalidate())}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus banner ini?"
        description="Banner langsung hilang dari halaman pelanggan. Untuk menyembunyikan sementara, matikan sakelarnya saja."
        confirmLabel="Hapus banner"
        destructive
        busy={busy}
        onConfirm={remove}
      />
    </CmsPage>
  );
}

function BannerDialog({
  banner,
  menu,
  onClose,
  onSaved,
}: {
  banner: Banner | "new" | null;
  menu: MenuItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = banner && banner !== "new" ? banner : null;
  return (
    <Dialog open={!!banner} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah banner" : "Tambah banner"}</DialogTitle>
          <DialogDescription>Gunakan gambar mendatar, rasio 2:1, misalnya 1200 × 600 piksel.</DialogDescription>
        </DialogHeader>
        {banner && <BannerForm key={editing?.id ?? "new"} banner={editing} menu={menu} onCancel={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function BannerForm({
  banner,
  menu,
  onCancel,
  onSaved,
}: {
  banner: Banner | null;
  menu: MenuItem[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [menuItemId, setMenuItemId] = useState(banner?.menuItemId ?? "");
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const imgErr = imageError(image) ?? (!banner && !image ? "Pilih gambar banner." : "");
    if (imgErr) return setError(imgErr);
    const fd = new FormData();
    if (image) fd.set("image", image);
    fd.set("menuItemId", menuItemId);
    fd.set("isActive", String(isActive));
    setSaving(true);
    try {
      if (banner) await api.updateBanner(banner.id, fd);
      else await api.addBanner(fd);
      toast.success(banner ? "Banner disimpan" : "Banner ditambahkan");
      onSaved();
    } catch (err) {
      if (!onAuthError(err, navigate)) toast.error("Banner gagal disimpan", { description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <Field data-invalid={!!error}>
        <FieldLabel>Gambar</FieldLabel>
        <ImagePicker
          value={image}
          currentUrl={banner?.imageUrl}
          onChange={(f) => (setImage(f), setError(imageError(f) ?? ""))}
          invalid={!!error}
          aspect="aspect-[2/1]"
          label="Pilih gambar banner"
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="banner-menu">Tautkan ke menu</FieldLabel>
        <NativeSelect id="banner-menu" value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}>
          <NativeSelectOption value="">Tidak ditautkan</NativeSelectOption>
          {menu.map((m) => (
            <NativeSelectOption key={m.id} value={m.id}>
              {m.name} · {rupiah(m.price)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>Pelanggan yang mengetuk banner dibawa ke menu ini.</FieldDescription>
      </Field>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-background p-4">
        <span className="grid">
          <span className="type-label-s">Tampilkan ke pelanggan</span>
          <span className="type-body-xs text-ink-soft">Matikan untuk menyimpan tanpa menampilkannya.</span>
        </span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Spinner label={false} />}
          {banner ? "Simpan perubahan" : "Tambah banner"}
        </Button>
      </DialogFooter>
    </form>
  );
}
