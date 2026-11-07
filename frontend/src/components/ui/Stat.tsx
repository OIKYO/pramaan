import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Mark it as needing someone's attention. */
  attention?: boolean;
  /** Open the list behind the number. */
  to?: string;
}

/** One number with its label, optionally a link to what it counts. */
export function Stat({ label, value, hint, attention = false, to }: StatProps) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-xs text-muted-text">
        {attention && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
        {label}
      </span>
      <span className="text-2xl font-semibold text-ink-strong tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted-text">{hint}</span>}
    </>
  );
  const className = "flex flex-col gap-1 rounded-lg border border-line bg-surface p-4";
  if (!to) return <div className={className}>{body}</div>;
  return (
    <Link to={to} className={cn(className, "transition-colors duration-(--duration-fast) hover:border-line-strong")}>
      {body}
    </Link>
  );
}
