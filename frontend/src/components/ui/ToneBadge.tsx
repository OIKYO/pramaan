import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "blocked" | "passed" | "warning" | "info" | "neutral" | "accent";

const TONES: Record<Tone, string> = {
  blocked: "bg-blocked-soft text-blocked",
  passed: "bg-passed-soft text-passed",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-sunken text-ink",
  accent: "bg-accent-soft text-ink-strong",
};

const DOTS: Record<Tone, string> = {
  blocked: "bg-blocked",
  passed: "bg-passed",
  warning: "bg-warning-mark",
  info: "bg-info",
  neutral: "bg-muted-text",
  accent: "bg-accent",
};

/** A small label: red blocks, blue needs a person, amber warns, green passed, grey is neutral. */
export function ToneBadge({ tone, children, dot = false }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1.5 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap", TONES[tone])}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", DOTS[tone])} />}
      {children}
    </span>
  );
}
