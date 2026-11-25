import { Icon } from "~/components/icon";
import { CAFE_ADDRESS, CAFE_NAME, GOOGLE_REVIEW_URL } from "~/lib/config";
import { setMode, useMode } from "~/lib/theme";

export function SiteFooter() {
  const mode = useMode();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <footer className="grid gap-3 px-4 pt-2 pb-8 text-center type-body-s text-ink-soft">
      <p>
        <span className="type-label-s text-ink">{CAFE_NAME}</span>
        {CAFE_ADDRESS && <span className="block">{CAFE_ADDRESS}</span>}
      </p>
      {GOOGLE_REVIEW_URL && (
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="mx-auto inline-flex min-h-10 items-center gap-2 rounded-full px-4 type-label-s text-ink-brand no-underline hover:bg-brand-tint-hover"
        >
          <Icon name="rating" className="text-star" />
          Beri kami ulasan di Google
        </a>
      )}
      <button
        type="button"
        onClick={() => setMode(next)}
        className="mx-auto inline-flex min-h-10 items-center gap-2 rounded-full px-4 type-label-s text-ink-soft hover:bg-fill-hover"
      >
        <Icon name={next === "dark" ? "dark-theme" : "light-theme"} />
        {next === "dark" ? "Mode gelap" : "Mode terang"}
      </button>
    </footer>
  );
}
