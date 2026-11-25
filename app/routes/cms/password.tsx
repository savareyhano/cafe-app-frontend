import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

import { CmsPage } from "~/components/cms-shell";
import { api, ApiError, errorMessage } from "~/lib/api";
import { clearSession, requireUser } from "~/lib/session";
import { Icon } from "~/components/icon";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

export async function clientLoader() {
  await requireUser();
  return null;
}

const schema = z
  .object({
    currentPassword: z.string().min(1, "Isi kata sandi saat ini."),
    newPassword: z
      .string()
      .min(8, "Minimal 8 karakter.")
      .max(255, "Maksimal 255 karakter.")
      .regex(/^(?=.*[0-9])(?=.*[A-Za-z]).*$/, "Gunakan minimal satu huruf dan satu angka."),
    confirmPassword: z.string().min(1, "Ulangi kata sandi baru."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Tidak sama dengan kata sandi baru.",
    path: ["confirmPassword"],
  });
type Values = z.infer<typeof schema>;

const FIELDS: { name: keyof Values; label: string; autoComplete: string; hint?: string }[] = [
  { name: "currentPassword", label: "Kata sandi saat ini", autoComplete: "current-password" },
  { name: "newPassword", label: "Kata sandi baru", autoComplete: "new-password", hint: "Minimal 8 karakter, dengan huruf dan angka." },
  { name: "confirmPassword", label: "Ulangi kata sandi baru", autoComplete: "new-password" },
];

export default function ChangePassword() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const submit = async (v: Values) => {
    try {
      await api.changePassword(v);
      clearSession();
      toast.success("Kata sandi diganti", { description: "Silakan masuk lagi dengan kata sandi baru." });
      navigate("/cms/masuk", { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.message === "Kata sandi saat ini salah.")
        form.setError("currentPassword", { message: e.message });
      else toast.error("Kata sandi gagal diganti", { description: errorMessage(e) });
    }
  };

  return (
    <CmsPage title="Ganti kata sandi" lead="Setelah diganti, Anda keluar dari semua perangkat dan perlu masuk lagi.">
      <Card className="max-w-lg">
        <CardContent>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-6" noValidate>
            <FieldGroup className="gap-4">
              {FIELDS.map((f) => (
                <Controller
                  key={f.name}
                  name={f.name}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                      <Input
                        {...field}
                        id={f.name}
                        type={show ? "text" : "password"}
                        autoComplete={f.autoComplete}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : f.hint && <FieldDescription>{f.hint}</FieldDescription>}
                    </Field>
                  )}
                />
              ))}
            </FieldGroup>
            <label className="flex min-h-10 w-fit cursor-pointer items-center gap-2 type-body-s">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4" />
              Tampilkan kata sandi
            </label>
            <Button type="submit" className="justify-self-start" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Spinner label={false} />
              ) : (
                <Icon name="password" />
              )}
              Ganti kata sandi
            </Button>
          </form>
        </CardContent>
      </Card>
    </CmsPage>
  );
}
