import { useInsights } from "@/api/hooks/useInsights";
import { CountChart } from "@/components/insights/CountChart";
import { StatTile } from "@/components/insights/StatTile";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingRows } from "@/components/ui/States";

export function InsightsPage() {
  const insights = useInsights();
  if (insights.isPending) return <LoadingRows rows={6} />;
  if (insights.isError) return <ErrorState error={insights.error} onRetry={() => void insights.refetch()} />;
  const data = insights.data;
  const approved = data.posters_by_status.find((s) => s.key === "approved")?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Insights"
        description="Where problems come from and which rules catch them, across every branch. Counts use each poster's current version."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Posters" value={data.total_posters} />
        <StatTile label="Approved" value={approved} />
        <StatTile label="Open blocking findings" value={data.open_blocking} />
        <StatTile label="AI calls" value={data.ai_calls} note="Each poster image is read once, then reused." />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CountChart title="Issues by branch" items={data.issues_by_branch} colour="var(--color-blocked)" empty="No issues yet." />
        <CountChart title="Issues by rule" items={data.issues_by_rule} colour="var(--color-warning)" empty="No issues yet." />
        <CountChart title="Posters by status" items={data.posters_by_status} colour="var(--color-info)" empty="No posters yet." />
        <CountChart title="Most overridden rules" items={data.most_overridden} colour="var(--color-ink)" empty="Head office hasn't overridden any finding." />
      </div>
    </div>
  );
}
