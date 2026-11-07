import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "blocked" | "passed" | "warning" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  blocked: "bg-blocked-soft text-blocked",
  passed: "bg-passed-soft text-passed",
  warning: "bg-warning-soft text-ink",
  info: "bg-info-soft text-info",
  neutral: "bg-ink-soft text-ink",
};

/** A small coloured label: red for blocked, teal for passed, orange for warnings and AI, blue for info. */
export function ToneBadge({ tone, children, dot = false }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone])}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", tone === "warning" ? "bg-warning" : "bg-current")} />}
      {children}
    </span>
  );
}
