import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { useReduceMotion } from "@/lib/preferences";

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduce] = useReduceMotion();
  return <MotionConfig reducedMotion={reduce ? "always" : "user"}>{children}</MotionConfig>;
}
