import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Where this page sits, in a few words (e.g. "Rulebook"). */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

/** The top of every page: where you are, what this page is for, and its main actions. */
export function PageHeader({ eyebrow, title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <p className="text-sm font-semibold text-muted-text">{eyebrow}</p>}
        <h1 className="text-3xl leading-tight break-words sm:text-4xl">{title}</h1>
        {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-text">{meta}</div>}
        {description && <p className="max-w-2xl text-pretty text-muted-text">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div>}
    </header>
  );
}
