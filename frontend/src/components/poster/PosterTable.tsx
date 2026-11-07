import { usePrefetchPoster } from "@/api/hooks/usePoster";
import type { PosterListItem } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Spinner } from "@/components/ui/Spinner";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL, formatDateTime } from "@/lib/labels";
import { StatusPill } from "./StatusPill";

/** What's still open on a poster, as one tag. */
function issues(poster: PosterListItem) {
  if (poster.pending) return <span className="text-muted-text">Not known yet</span>;
  if (poster.blocking > 0) return <ToneBadge tone="blocked">{poster.blocking} blocking</ToneBadge>;
  if (poster.open_issues > 0) return <ToneBadge tone="warning">{poster.open_issues} to weigh</ToneBadge>;
  return <ToneBadge tone="passed">None open</ToneBadge>;
}

/** Posters with where they are in review and what's still open. A row opens the poster; pointing
 * at it starts loading the poster, so it opens without a wait. */
export function PosterTable({ posters, showBranch = false }: { posters: PosterListItem[]; showBranch?: boolean }) {
  const prefetch = usePrefetchPoster();
  const columns: Column<PosterListItem>[] = [
    {
      header: "Poster",
      cell: (p) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-ink-strong">{p.title}</span>
          <span className="text-xs text-muted-text">
            {CHANNEL_LABEL[p.channel]} · version {p.current_version} · {p.created_by_name}
          </span>
        </div>
      ),
    },
    ...(showBranch ? [{ header: "Branch", cell: (p: PosterListItem) => p.branch_name }] : []),
    {
      header: "Status",
      cell: (p) =>
        p.pending ? (
          <span className="inline-flex items-center gap-2 text-muted-text">
            <Spinner /> Running checks
          </span>
        ) : (
          <StatusPill status={p.status} stage={p.review_stage} />
        ),
    },
    { header: "Open issues", cell: issues },
    { header: "Updated", align: "end", shrink: true, cell: (p) => <span className="text-muted-text tabular-nums">{formatDateTime(p.updated_at)}</span> },
  ];
  return (
    <DataTable
      caption="Posters"
      columns={columns}
      rows={posters}
      rowKey={(p) => p.id}
      rowLink={(p) => (p.pending ? null : { to: `/posters/${p.id}`, label: `Open ${p.title}` })}
      onRowIntent={(p) => !p.pending && prefetch(p.id)}
    />
  );
}
