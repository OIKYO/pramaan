import { motion } from "motion/react";
import { useNavigation } from "react-router";
import { loadingBar } from "@/lib/motion";

/** A thin orange line at the top of the screen while the next page loads. */
export function NavProgress() {
  const loading = useNavigation().state !== "idle";
  if (!loading) return null;
  return (
    <motion.div
      role="progressbar"
      aria-label="Loading the page"
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
      initial={loadingBar.initial}
      animate={loadingBar.animate}
      transition={loadingBar.transition}
    />
  );
}
