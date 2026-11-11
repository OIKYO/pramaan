import type { Problem } from "@/lib/findings";
import { cn } from "@/lib/utils";

interface PageStripProps {
  pages: { index: number; image_url: string | null }[];
  problems: Problem[];
  value: number;
  onChange: (page: number) => void;
}

export function PageStrip({ pages, problems, value, onChange }: PageStripProps) {
  return (
    <div role="tablist" aria-label="Pages of the post" className="flex gap-2 overflow-x-auto pb-1">
      {pages.map((page, i) => {
        const open = problems.filter((p) => p.page === i && p.finding.status === "open").length;
        return (
          <button
            key={page.index}
            type="button"
            role="tab"
            aria-selected={i === value}
            onClick={() => onChange(i)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-md border bg-surface p-1 text-xs",
              i === value ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong",
            )}
          >
            {page.image_url ? (
              <img src={page.image_url} alt="" className="h-16 w-auto rounded-xs object-cover" />
            ) : (
              <span className="h-16 w-12 rounded-xs bg-surface-sunken" />
            )}
            <span className={open ? "text-ink-strong" : "text-muted-text"}>
              Page {i + 1}
              {open > 0 && <span className="tabular-nums"> · {open} open</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
