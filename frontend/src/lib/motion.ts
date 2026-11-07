/**
 * The only place animations are defined. Motion answers a person's action (switching the theme,
 * opening the passed checks, finding the problem they clicked); it is never decoration. No hover
 * lifts, no entrance fades on load, no looping effects. Only components/ui and lib/theme use this.
 *
 * Durations mirror --duration-* in styles/tokens.css; change both together.
 * Everything here stops for people who ask their device to reduce motion.
 */
import type { Transition } from "motion/react";

export const durations = { fast: 0.12, base: 0.2, slow: 0.32 } as const;
const ease: [number, number, number, number] = [0.2, 0, 0, 1];

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A panel that appears because the person asked for it (e.g. "Show passed checks"). */
export const reveal = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: durations.base, ease } satisfies Transition,
};

/** The thin bar at the top while the next page loads. It eases most of the way, then waits. */
export const loadingBar = {
  initial: { scaleX: 0 },
  animate: { scaleX: 0.85 },
  transition: { duration: 2.4, ease: [0.1, 0.6, 0.3, 1] } satisfies Transition,
};

/** Cross-fade the whole page when the theme changes, where the browser supports it. */
export function swapTheme(apply: () => void) {
  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  if (!doc.startViewTransition || reduceMotion()) apply();
  else doc.startViewTransition(apply);
}

/** Bring the finding a person picked on the poster into view. */
export function scrollToItem(element: Element | null) {
  element?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" });
}
