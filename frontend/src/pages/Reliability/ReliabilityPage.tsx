import { useReliability } from "@/api/hooks/useReliability";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { REPO } from "@/components/landing/links";
import { CheckList } from "@/components/reliability/CheckList";
import { PosterResults } from "@/components/reliability/PosterResults";
import { ReliabilityMethod } from "@/components/reliability/ReliabilityMethod";
import { ReliabilitySummary } from "@/components/reliability/ReliabilitySummary";
import { QueryState } from "@/components/ui/QueryState";

export function ReliabilityPage() {
  const report = useReliability();
  return (
    <PublicLayout>
      <QueryState query={report}>
        {(data) => (
          <>
            <ReliabilitySummary report={data} />
            <CheckList checks={data.checks} />
            <PosterResults results={data.results} />
            <ReliabilityMethod generator={`${REPO}/blob/main/tools/make_test_posters.py`} runner={`${REPO}/blob/main/backend/scripts/reliability.py`} />
          </>
        )}
      </QueryState>
    </PublicLayout>
  );
}
