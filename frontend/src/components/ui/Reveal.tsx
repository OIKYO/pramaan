import { motion } from "motion/react";
import type { ReactNode } from "react";
import { reveal } from "@/lib/motion";

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={reveal.initial} animate={reveal.animate} transition={reveal.transition}>
      {children}
    </motion.div>
  );
}
