import { useInsights } from "@/api/hooks/useInsights";
import { CountChart } from "@/components/insights/CountChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { Stat } from "@/components/ui/Stat";

export function InsightsPage() {
  const insights = useInsights();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Insights" }]}
        title="Insights"
        description="Where problems come from and which rules catch them, across your branches. Counts use each poster's current version."
      />
      <QueryState query={insights} loadingRows={6}>
        {(data) => (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Posters" value={data.total_posters} />
              <Stat label="Approved" value={data.posters_by_status.find((s) => s.key === "approved")?.count ?? 0} />
              <Stat label="Open blocking findings" value={data.open_blocking} attention={data.open_blocking > 0} />
              <Stat label="AI reads" value={data.ai_calls} hint="Each image is read once, then reused." />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <CountChart title="Issues by branch" items={data.issues_by_branch} colour="var(--color-blocked)" empty="No issues yet." />
              <CountChart title="Issues by rule" items={data.issues_by_rule} colour="var(--color-warning-mark)" empty="No issues yet." />
              <CountChart title="Posters by status" items={data.posters_by_status} colour="var(--color-info)" empty="No posters yet." />
              <CountChart title="Most overridden rules (may be unclear)" items={data.most_overridden} colour="var(--color-ink-strong)" empty="Head office hasn't overridden any finding." />
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
