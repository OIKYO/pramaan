import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { picked, reveal } from "@/lib/motion";

interface HighlightProps {
  active: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Pulses once each time `active` turns on, to show what the person just selected. */
export function Highlight({ active, children, className, style }: HighlightProps) {
  return (
    <motion.div
      key={active ? "on" : "off"}
      className={className}
      style={style}
      animate={active ? picked.animate : undefined}
      transition={picked.transition}
    >
      {children}
    </motion.div>
  );
}

/** Fades content in when the person opens it. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={reveal.initial} animate={reveal.animate} transition={reveal.transition}>
      {children}
    </motion.div>
  );
}
