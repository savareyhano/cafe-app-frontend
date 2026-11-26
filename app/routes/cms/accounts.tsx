import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

import type { Route } from "./+types/accounts";
import { CmsPage, onBand } from "~/components/cms-shell";
import { api, errorMessage } from "~/lib/api";
import { ROLE_LABEL } from "~/lib/format";
import { ADMIN, onAuthError, requireUser } from "~/lib/session";
import type { Role, User } from "~/lib/types";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Icon } from "~/components/icon";
import { Pager } from "~/components/pager";
import { SearchInput } from "~/components/search-input";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Spinner } from "~/components/ui/spinner";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const me = await requireUser(ADMIN);
  const sp = new URL(request.url).searchParams;
  const res = await api.users({
    page: Number(sp.get("hal")) || 1,
    perPage: 20,
    search: sp.get("cari") ?? "",
    sortBy: "username",
    sortOrder: "asc",
  });
  return { me, users: res.data, pagination: res.pagination };
}

const ROLE_BADGE = { staff: "default", admin: "brand", super_admin: "solid" } as const;

export default function Accounts({ loaderData }: Route.ComponentProps) {
  const { me, users, pagination } = loaderData;
  const [sp, setSp] = useSearchParams();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [secret, setSecret] = useState<{ username: string; password: string; isNew: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const superAdmin = me.role === "super_admin";
  // Backend rule: only a super admin may touch admin or super admin accounts; nobody edits themselves here
  const canManage = (u: User) => u.id !== me.id && (superAdmin || u.role === "staff");
  const roles: Role[] = superAdmin ? ["staff", "admin", "super_admin"] : ["staff"];

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

  const run = async (fn: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await fn();
      revalidator.revalidate();
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error(failTitle, { description: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CmsPage
      title="Akun staf"
      actions={
        <Button className={onBand} size="sm" onClick={() => setEditing("new")}>
          <Icon name="plus" />
          Tambah akun
        </Button>
      }
    >
      <SearchInput defaultValue={sp.get("cari") ?? ""} onSearch={(q) => setParam("cari", q)} placeholder="Cari nama pengguna" className="max-w-sm" />

      {users.length === 0 ? (
        <Empty className="rounded-2xl bg-surface shadow-ds-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="group" />
            </EmptyMedia>
            <EmptyTitle>Tidak ada yang cocok dengan “{sp.get("cari")}”</EmptyTitle>
          </EmptyHeader>
          <Button variant="outline" size="sm" onClick={() => setParam("cari", "")}>
            Hapus pencarian
          </Button>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama pengguna</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="w-px">
                <span className="sr-only">Tindakan</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-muted type-label-s text-ink-soft">
                      {u.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="type-label-s">{u.username}</span>
                    {u.id === me.id && <Badge variant="outline" size="sm">Anda</Badge>}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canManage(u) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Tindakan untuk ${u.username}`}>
                          <Icon name="overflow-vertical" className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(u)}>
                          <Icon name="edit" />
                          Ubah
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setResetting(u)}>
                          <Icon name="reset-password" />
                          Reset kata sandi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(u)}>
                          <Icon name="delete" />
                          Hapus akun
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="sr-only">Tidak bisa diubah</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager pagination={pagination} onPage={(p) => setParam("hal", p === 1 ? "" : String(p))} noun="akun" />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && editing !== "new" ? `Ubah ${editing.username}` : "Tambah akun"}</DialogTitle>
            <DialogDescription>
              {editing && editing !== "new"
                ? "Pemilik akun akan keluar dari semua perangkat dan perlu masuk lagi."
                : "Kata sandi dibuat otomatis dan ditampilkan sekali setelah akun dibuat."}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <UserForm
              key={editing === "new" ? "new" : editing.id}
              user={editing === "new" ? null : editing}
              roles={roles}
              onCancel={() => setEditing(null)}
              onSaved={(created) => {
                setEditing(null);
                if (created) setSecret({ ...created, isNew: true });
                revalidator.revalidate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!resetting}
        onOpenChange={(o) => !o && setResetting(null)}
        title={`Reset kata sandi ${resetting?.username ?? ""}?`}
        description="Kata sandi baru dibuat otomatis dan ditampilkan sekali. Pemilik akun keluar dari semua perangkat."
        confirmLabel="Reset kata sandi"
        busy={busy}
        onConfirm={() =>
          run(async () => {
            const u = resetting!;
            const { data } = await api.resetUserPassword(u.id);
            setResetting(null);
            setSecret({ username: u.username, password: data.password, isNew: false });
          }, "Kata sandi gagal direset")
        }
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Hapus akun ${deleting?.username ?? ""}?`}
        description="Akun tidak bisa masuk lagi. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus akun"
        destructive
        busy={busy}
        onConfirm={() =>
          run(async () => {
            await api.deleteUser(deleting!.id);
            toast.success(`Akun ${deleting!.username} dihapus`);
            setDeleting(null);
          }, "Akun gagal dihapus")
        }
      />
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </CmsPage>
  );
}

const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Isi nama pengguna.")
    .max(255, "Maksimal 255 karakter.")
    .regex(/^[0-9A-Za-z]+$/, "Hanya huruf dan angka, tanpa spasi."),
  role: z.enum(["staff", "admin", "super_admin"]),
});

function UserForm({
  user,
  roles,
  onCancel,
  onSaved,
}: {
  user: User | null;
  roles: Role[];
  onCancel: () => void;
  onSaved: (created?: { username: string; password: string }) => void;
}) {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: user?.username ?? "", role: user?.role ?? "staff" },
  });

  const submit = async (v: z.infer<typeof userSchema>) => {
    try {
      if (user) {
        const body: { username?: string; role?: Role } = {};
        if (v.username !== user.username) body.username = v.username;
        if (v.role !== user.role) body.role = v.role;
        if (!body.username && !body.role) return onSaved();
        await api.updateUser(user.id, body);
        toast.success("Akun diperbarui");
        onSaved();
      } else {
        const { data } = await api.addUser(v);
        onSaved({ username: v.username, password: data.password });
      }
    } catch (e) {
      if (!onAuthError(e, navigate)) toast.error("Akun gagal disimpan", { description: errorMessage(e) });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="grid gap-5" noValidate>
      <FieldGroup className="gap-4">
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="acc-username">Nama pengguna</FieldLabel>
              <Input {...field} id="acc-username" autoCapitalize="none" autoComplete="off" aria-invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : <FieldDescription>Huruf dan angka saja.</FieldDescription>}
            </Field>
          )}
        />
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="acc-role">Peran</FieldLabel>
              <NativeSelect id="acc-role" value={field.value} onChange={(e) => field.onChange(e.target.value)} disabled={roles.length === 1}>
                {roles.map((r) => (
                  <NativeSelectOption key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>Staf hanya bisa mengelola pesanan. Admin mengelola semuanya.</FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner label={false} />}
          {user ? "Simpan perubahan" : "Buat akun"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SecretDialog({
  secret,
  onClose,
}: {
  secret: { username: string; password: string; isNew: boolean } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret!.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin. Pilih teksnya lalu salin manual.");
    }
  };
  return (
    <Dialog open={!!secret} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{secret?.isNew ? `Akun ${secret.username} dibuat` : `Kata sandi ${secret?.username} direset`}</DialogTitle>
          <DialogDescription>
            Berikan kata sandi ini ke pemilik akun. Kata sandi hanya ditampilkan sekarang; setelah ditutup tidak bisa dilihat
            lagi. Minta mereka menggantinya setelah masuk.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg bg-background p-2 pl-4">
          <code className="flex-1 bg-transparent type-label-m break-all select-all">{secret?.password}</code>
          <Button variant="secondary" size="sm" onClick={copy}>
            <Icon name={copied ? "correct" : "copy"} />
            {copied ? "Tersalin" : "Salin"}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
