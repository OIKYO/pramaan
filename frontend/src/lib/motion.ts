/**
 * The only place animations are defined. Motion answers a person's action (opening a drawer,
 * highlighting the finding they clicked); it is never decoration. Only components/ui imports this.
 *
 * Durations mirror --duration-* in styles/tokens.css; change both together.
 * <MotionConfig reducedMotion="user"> in main.tsx turns movement off for people who ask for that.
 */
import type { Transition } from "motion/react";

export const durations = { fast: 0.12, base: 0.2, slow: 0.32 } as const;
const ease: [number, number, number, number] = [0.2, 0, 0, 1];

/** The finding or poster box a person just picked: one short pulse so the eye lands on it. */
export const picked = {
  animate: { scale: [1, 1.02, 1] },
  transition: { duration: durations.slow, ease } satisfies Transition,
};

/** A panel that appears because the person asked for it (e.g. "Show passed checks"). */
export const reveal = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durations.base, ease } satisfies Transition,
};
