import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { useReduceMotion } from "@/lib/preferences";

/** Respects "reduce motion", from the device or from Settings, for every animation in the app. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduce] = useReduceMotion();
  return <MotionConfig reducedMotion={reduce ? "always" : "user"}>{children}</MotionConfig>;
}
