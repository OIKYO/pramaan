import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Leave out the inner padding, for tables and lists that run edge to edge. */
  flush?: boolean;
}

/** A bordered section of a page with an optional title row. Panels sit side by side; they don't nest. */
export function Panel({ title, description, actions, children, flush = false }: PanelProps) {
  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-line bg-surface">
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && <h2 className="text-sm">{title}</h2>}
            {description && <p className="text-xs text-muted-text">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn(!flush && "p-4")}>{children}</div>
    </section>
  );
}
