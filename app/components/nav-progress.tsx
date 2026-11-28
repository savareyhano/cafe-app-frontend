import { AnimatePresence, m } from "motion/react";
import { useNavigation } from "react-router";

/**
 * Page-loading signal for the whole app: a thin line across the top while the next page's data
 * loads. It creeps toward 85% (the real length is unknown), then fills and fades when the page arrives.
 */
export function NavProgress() {
  const navigation = useNavigation();

  return (
    <AnimatePresence>
      {navigation.state === "loading" && (
        <m.div
          key="nav-progress"
          role="progressbar"
          aria-label="Memuat halaman"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[var(--ds-selected)]"
          initial={{ scaleX: 0 }}
          // Waits 150 ms so instant loads never flash it
          animate={{ scaleX: 0.85, transition: { delay: 0.15, duration: 6, ease: [0.1, 0.6, 0.2, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { scaleX: { duration: 0.2 }, opacity: { duration: 0.2, delay: 0.15 } } }}
        />
      )}
    </AnimatePresence>
  );
}
