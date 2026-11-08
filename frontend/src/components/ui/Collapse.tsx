import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { collapse } from "@/lib/motion";

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div key="content" {...collapse} style={{ overflow: "hidden" }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
