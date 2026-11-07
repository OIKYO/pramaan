import type { Severity } from "@/api/types";
import { cn } from "@/lib/utils";

const TONE: Record<Severity, string> = {
  block: "bg-blocked text-on-tone",
  needs_human: "bg-info text-on-tone",
  warn: "bg-warning-mark text-on-accent",
  pass: "bg-passed text-on-tone",
};

/** The number that ties a finding in the list to its box on the poster, in the finding's colour. */
export function FindingNumber({ number, severity, muted = false }: { number: number; severity: Severity; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-6 shrink-0 place-items-center rounded-sm text-xs font-bold tabular-nums", muted ? "bg-line-strong text-ink" : TONE[severity])}
    >
      {number}
    </span>
  );
}
