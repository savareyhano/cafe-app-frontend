import { useEffect, useState } from "react";

import { CAFE_NAME, GOOGLE_REVIEW_URL } from "~/lib/config";
import { readJson, writeJson } from "~/lib/storage";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/icon";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";

const DONE_KEY = "rate-prompt-done";

/**
 * Asks once per device, after the first completed order, for a Google review. Any way of
 * closing it (button, Esc, outside tap) counts as answered, so it never comes back.
 * Every path keeps the Google link: asking only happy guests would be review gating, which
 * Google's review policy forbids.
 */
export function RateUsDialog({ customerName }: { customerName: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"ask" | "love" | "improve">("ask");

  useEffect(() => {
    if (!GOOGLE_REVIEW_URL || readJson(DONE_KEY, false)) return;
    // Let the "order completed" state land before asking
    const t = setTimeout(() => {
      writeJson(DONE_KEY, true);
      setOpen(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  if (!GOOGLE_REVIEW_URL) return null;
  const close = () => setOpen(false);
  const firstName = customerName.trim().split(/\s+/)[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm max-sm:pt-0" showCloseButton={false}>
        <ReviewHero />

        <div className="grid gap-5 px-6 pt-5 pb-6 text-center max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {step === "ask" && (
            <>
              <div className="grid gap-1.5">
                <DialogTitle className="pr-0 type-display-xs">Suka makanannya, {firstName}?</DialogTitle>
                <DialogDescription>Beri kami ulasan di Google, biar makin banyak orang kenal {CAFE_NAME}.</DialogDescription>
              </div>
              <div className="grid gap-3">
                <Button size="lg" onClick={() => setStep("love")}>
                  Enak banget, suka!
                </Button>
                <Button variant="outline" size="lg" onClick={() => setStep("improve")}>
                  Masih ada yang kurang
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="justify-self-center text-ink-soft" onClick={close}>
                Nanti saja
              </Button>
            </>
          )}

          {step === "love" && (
            <>
              <div className="grid gap-1.5">
                <DialogTitle className="pr-0 type-display-xs">Senang dengarnya!</DialogTitle>
                <DialogDescription>Tinggal satu langkah: tulis ulasan Anda di Google.</DialogDescription>
              </div>
              <div className="grid gap-2">
                <Button size="lg" asChild>
                  <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" onClick={close}>
                    <Icon name="rating" className="size-5 text-star" />
                    Tulis ulasan di Google
                  </a>
                </Button>
                <Button variant="ghost" onClick={close}>
                  Lain kali
                </Button>
              </div>
            </>
          )}

          {step === "improve" && (
            <>
              <div className="grid gap-1.5">
                <DialogTitle className="pr-0 type-display-xs">Terima kasih sudah jujur</DialogTitle>
                <DialogDescription>
                  Maaf belum sempurna. Kasih tahu staf kami apa yang kurang, biar langsung kami perbaiki. Mau tulis di
                  ulasan Google juga boleh.
                </DialogDescription>
              </div>
              <div className="grid gap-2">
                <Button size="lg" onClick={close}>
                  Oke, saya sampaikan ke staf
                </Button>
                <Button variant="ghost" asChild>
                  <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" onClick={close}>
                    Tulis ulasan di Google
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// The Google "G", only as the badge on a link to Google reviews; do not alter or reuse it elsewhere
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

/** A faded background review card: avatar initial, name bar, small stars, two text lines. */
function BackCard({ initial, className }: { initial: string; className?: string }) {
  return (
    <div className={cn("absolute w-44 rounded-xl bg-surface p-3 opacity-55 shadow-ds-1", className)}>
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-[var(--ds-hue-red)] text-[0.625rem] font-semibold text-white">
          {initial}
        </span>
        <span className="h-1.5 w-16 rounded-full bg-muted" />
      </div>
      <div className="mt-2 flex gap-0.5 text-star">
        {[0, 1, 2, 3, 4].map((i) => (
          <Icon key={i} name="rating" className="size-3.5" />
        ))}
      </div>
      <span className="mt-2 block h-1.5 w-full rounded-full bg-muted" />
      <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-muted" />
    </div>
  );
}

// Header art: one upright review card with five clear stars, on a light blue plane of faded,
// tilted cards. Everything settles once (no loop); different durations give a stagger without
// delays, so nothing is ever left invisible mid-delay.
function ReviewHero() {
  return (
    <div aria-hidden className="relative h-52 overflow-hidden bg-info-tint">
      <div className="absolute inset-0 -rotate-[12deg]">
        <BackCard initial="A" className="top-1 -left-14 animate-[review-in_700ms_var(--ds-ease-move-in)_both]" />
        <BackCard initial="D" className="-right-14 bottom-1 animate-[review-in_800ms_var(--ds-ease-move-in)_both]" />
      </div>
      <div className="absolute top-1/2 left-1/2 w-60 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface px-5 pt-4 pb-5 shadow-ds-3 animate-[review-in-front_600ms_var(--ds-ease-flair-in)_both] dark:ring-1 dark:ring-border">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-[var(--ds-hue-red)] type-label-s text-white">R</span>
          <span className="grid gap-1.5">
            <span className="h-2 w-24 rounded-full bg-muted" />
            <span className="h-1.5 w-14 rounded-full bg-muted" />
          </span>
        </div>
        <div className="mt-3 flex justify-between text-star">
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="rating" className="size-8" />
          ))}
        </div>
        <span className="absolute -right-4 -bottom-4 grid size-12 place-items-center rounded-full bg-white shadow-ds-2">
          <GoogleG className="size-7" />
        </span>
      </div>
    </div>
  );
}
