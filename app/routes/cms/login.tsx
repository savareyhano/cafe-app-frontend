import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import * as z from "zod";

import { api, ApiError, errorMessage } from "~/lib/api";
import { CAFE_NAME } from "~/lib/config";
import { clearSession } from "~/lib/session";
import { BrandMark } from "~/components/brand";
import { Icon } from "~/components/icon";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

export function meta() {
  return [{ title: `Masuk · ${CAFE_NAME}` }];
}

const schema = z.object({
  username: z.string().trim().min(1, "Isi nama pengguna."),
  password: z.string().min(1, "Isi kata sandi."),
});

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async ({ username, password }: z.infer<typeof schema>) => {
    setError("");
    try {
      await api.login(username, password);
      clearSession();
      navigate("/cms");
    } catch (e) {
      setError(e instanceof ApiError && e.status === 400 ? "Nama pengguna atau kata sandi salah." : errorMessage(e));
    }
  };

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The sign-in band: a flat brand panel whose corners facing the form are rounded */}
      <aside className="relative flex flex-col justify-between gap-10 bg-band px-6 pt-6 pb-16 text-white lg:m-0 lg:rounded-r-[2.5rem] lg:p-10">
        <div className="flex items-center gap-3">
          <BrandMark inverse />
          <span className="type-label-m">{CAFE_NAME}</span>
          <ModeToggle onBand className="ml-auto" />
        </div>
        <div className="grid max-w-md gap-3">
          <h1 className="type-display-m leading-tight text-white">Konsol staf</h1>
          <p className="type-body-m text-white/85">
            Terima pesanan, konfirmasi pembayaran tunai, dan tandai pesanan siap diambil.
          </p>
        </div>
      </aside>

      <main className="relative -mt-8 grid place-items-start rounded-t-2xl bg-surface px-6 pt-10 pb-12 lg:mt-0 lg:place-items-center lg:rounded-none">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full max-w-sm gap-6" noValidate>
          <div className="grid gap-1">
            <h2 className="type-heading-s">Masuk</h2>
            <p className="type-body-s text-ink-soft">Gunakan akun yang diberikan admin kafe.</p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-lg bg-danger-tint p-4 text-danger-ink">
              <Icon name="error" className="mt-0.5 size-5" />
              <p className="type-body-s">{error}</p>
            </div>
          )}

          <FieldGroup>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="username">Nama pengguna</FieldLabel>
                  <Input {...field} id="username" autoComplete="username" autoCapitalize="none" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      className="pr-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="absolute top-2 right-2 text-ink-soft"
                      onClick={() => setShowPw((s) => !s)}
                      aria-pressed={showPw}
                    >
                      {showPw ? "Sembunyikan" : "Tampilkan"}
                    </Button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Spinner label={false} />
            )}
            Masuk
          </Button>
        </form>
      </main>
    </div>
  );
}
