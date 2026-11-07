import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Something is being worked on right now (checks running, signing in). Still for reduced motion. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={cn("size-4 shrink-0 motion-safe:animate-spin", className)} />;
}
