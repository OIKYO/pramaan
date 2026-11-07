import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Respects the person's "reduce motion" setting for every animation in the app. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
