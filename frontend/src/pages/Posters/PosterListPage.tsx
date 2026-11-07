import type { ReactNode } from "react";
import { usePosterList, type PosterScope } from "@/api/hooks/usePosters";
import { PosterList } from "@/components/poster/PosterList";
import { PosterTable } from "@/components/poster/PosterTable";
import { PageHeader, type Crumb } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

interface PosterListPageProps {
  scope: PosterScope;
  crumbs?: Crumb[];
  title: string;
  description: string;
  emptyTitle: string;
  emptyText: string;
  actions?: ReactNode;
  showBranch?: boolean;
  /** Offer a status filter and search (for the longer lists). */
  browsable?: boolean;
}

/** Layout shared by My posters, All posters, Review queue and Final approvals. */
export function PosterListPage({ scope, crumbs, title, description, emptyTitle, emptyText, actions, showBranch, browsable }: PosterListPageProps) {
  const posters = usePosterList(scope);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={crumbs} title={title} description={description} actions={actions} />
      <QueryState
        query={posters}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title={emptyTitle} action={actions}>{emptyText}</EmptyState>}
      >
        {(data) => (browsable ? <PosterList posters={data} showBranch={showBranch} /> : <PosterTable posters={data} showBranch={showBranch} />)}
      </QueryState>
    </div>
  );
}
