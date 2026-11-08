import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  crumbs?: Crumb[];
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ crumbs, title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-text">
          {crumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-ink-strong">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl leading-7 wrap-break-word sm:text-2xl sm:leading-8">{title}</h1>
          {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-text">{meta}</div>}
          {description && <p className="max-w-2xl text-pretty text-muted-text">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">{actions}</div>}
      </div>
    </header>
  );
}
