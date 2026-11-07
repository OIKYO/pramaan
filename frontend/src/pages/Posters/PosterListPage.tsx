import type { ReactNode } from "react";
import { usePosterList, type PosterScope } from "@/api/hooks/usePosters";
import { PosterTable } from "@/components/poster/PosterTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";

interface PosterListPageProps {
  scope: PosterScope;
  title: string;
  description: string;
  emptyTitle: string;
  emptyText: string;
  actions?: ReactNode;
  showBranch?: boolean;
}

/** Layout shared by My posters, Review queue and Final approvals. */
export function PosterListPage({ scope, title, description, emptyTitle, emptyText, actions, showBranch }: PosterListPageProps) {
  const posters = usePosterList(scope);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} actions={actions} />
      {posters.isPending ? (
        <LoadingRows />
      ) : posters.isError ? (
        <ErrorState error={posters.error} onRetry={() => void posters.refetch()} />
      ) : posters.data.length === 0 ? (
        <EmptyState title={emptyTitle} action={actions}>
          {emptyText}
        </EmptyState>
      ) : (
        <PosterTable posters={posters.data} showBranch={showBranch} />
      )}
    </div>
  );
}
