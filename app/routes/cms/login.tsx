import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import * as z from "zod";

import { api, ApiError, errorMessage } from "~/lib/api";
import { CAFE_NAME } from "~/lib/config";
import { clearSession } from "~/lib/session";
import { CafeRoom } from "~/components/cafe-scene";
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
    // One café room behind the whole page, the same in light and dark mode. color-scheme light makes
    // the form's tokens resolve to their light values on the cream room in either mode.
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#F4EEDF] text-[#202020] [color-scheme:light]">
      <CafeRoom className="absolute inset-0 -z-10" />

      {/* The café's name hangs on the sign over the bar, so the header only holds the theme toggle */}
      <header className="flex justify-end px-5 pt-5 lg:px-10 lg:pt-8">
        <ModeToggle className="rounded-full bg-[#FBF7EC]/90 backdrop-blur-sm" />
      </header>

      {/* Phones: the card sits high so the queue and counter show below it. Wide screens: floating on the right, clear of the bar. */}
      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-10 lg:items-center lg:justify-end lg:px-16 xl:pr-28">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid w-full max-w-md gap-5 rounded-[1.75rem] border border-white/70 bg-[#FBF7EC]/80 p-5 shadow-[0_24px_60px_-28px_#2F4A2E80] backdrop-blur-md sm:gap-6 sm:p-9"
          noValidate
        >
          <div className="grid gap-1.5">
            <h1 className="type-display-s text-[#2F4A2E]">Konsol staf</h1>
            <p className="type-body-s text-ink-soft">
              Terima pesanan, konfirmasi pembayaran tunai, dan tandai pesanan siap diambil. Masuk dengan akun dari admin kafe.
            </p>
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
