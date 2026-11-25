import { m } from "motion/react";
import { useLocation, useNavigation, type Location } from "react-router";

export const EASE_OUT = [0, 0, 0.2, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

const byPath = (l: Pick<Location, "pathname">) => l.pathname;

/**
 * Page change: rises 12px and fades in over 220ms when mounted, and fades out over 120ms while a
 * navigation to a different page loads. The old page stays the live page until then, so nothing
 * renders against stale route data.
 */
export function PageFade({
  pageKey = byPath,
  initial = true,
  className,
  children,
}: {
  pageKey?: (l: Pick<Location, "pathname" | "search">) => string;
  initial?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigation = useNavigation();
  const leaving = navigation.state === "loading" && pageKey(navigation.location) !== pageKey(location);
  return (
    <m.div
      className={className}
      initial={initial ? { opacity: 0, y: 12 } : false}
      animate={
        leaving
          ? { opacity: 0, transition: { duration: 0.12, ease: EASE_IN } }
          : { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } }
      }
    >
      {children}
    </m.div>
  );
}
