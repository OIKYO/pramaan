import type { ReactNode } from "react";
import { usePosterList, type PosterScope } from "@/api/hooks/usePosters";
import { PosterList } from "@/components/poster/PosterList";
import { PosterTable } from "@/components/poster/PosterTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

interface PosterListPageProps {
  scope: PosterScope;
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyText: string;
  actions?: ReactNode;
  showBranch?: boolean;
  /** Offer a filter by where posters stand (for a branch's own list). */
  filterable?: boolean;
}

/** Layout shared by My posters, Review queue and Final approvals. */
export function PosterListPage({ scope, eyebrow, title, description, emptyTitle, emptyText, actions, showBranch, filterable }: PosterListPageProps) {
  const posters = usePosterList(scope);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      <QueryState
        query={posters}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState title={emptyTitle} action={actions}>
            {emptyText}
          </EmptyState>
        }
      >
        {(data) => (filterable ? <PosterList posters={data} /> : <PosterTable posters={data} showBranch={showBranch} />)}
      </QueryState>
    </div>
  );
}
