import { useInsights } from "@/api/hooks/useInsights";
import { usePosterList } from "@/api/hooks/usePosters";
import { Stat } from "@/components/ui/Stat";

export function OverviewStats() {
  const finals = usePosterList("final_approval").data;
  const regional = usePosterList("regional_review").data;
  const insights = useInsights().data;
  const waiting = finals?.length ?? 0;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Waiting for your approval" value={finals ? waiting : "–"} attention={waiting > 0} to="/approvals" />
      <Stat label="With regional managers" value={regional ? regional.length : "–"} to="/review" />
      <Stat label="Open blocking findings" value={insights ? insights.open_blocking : "–"} to="/posters" />
      <Stat
        label="Posters checked"
        value={insights ? insights.total_posters : "–"}
        hint={insights ? `${insights.ai_calls} AI reads so far` : undefined}
        to="/insights"
      />
    </div>
  );
}
