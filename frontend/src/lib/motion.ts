import type { Transition } from "motion/react";
import { reduceMotionHere } from "./preferences";

export const durations = { fast: 0.12, base: 0.2, slow: 0.32 } as const;
const ease: [number, number, number, number] = [0.2, 0, 0, 1];

const reduceMotion = () =>
  reduceMotionHere() || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

export const reveal = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: durations.base, ease } satisfies Transition,
};

export const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: durations.base, ease } satisfies Transition,
};

export const popClasses =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
  "data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98] data-[side=bottom]:slide-in-from-top-1 " +
  "data-[side=top]:slide-in-from-bottom-1 duration-150 motion-reduce:animate-none";

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: durations.slow, ease } satisfies Transition,
};

export const loadingBar = {
  initial: { scaleX: 0 },
  animate: { scaleX: 0.85 },
  transition: { duration: 2.4, ease: [0.1, 0.6, 0.3, 1] } satisfies Transition,
};

export function swapTheme(apply: () => void) {
  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  if (!doc.startViewTransition || reduceMotion()) apply();
  else doc.startViewTransition(apply);
}

export function scrollToItem(element: Element | null) {
  element?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" });
}
