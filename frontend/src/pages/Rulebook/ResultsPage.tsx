import { useState } from "react";
import { useResultStats } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { ResultStat } from "@/api/types";
import { RulebookActions } from "@/components/rulebook/RulebookActions";
import { StatForm } from "@/components/rulebook/StatForm";
import { StatTable } from "@/components/rulebook/StatTable";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";
import { download } from "@/lib/csv";
import { statsCsv } from "@/lib/rulebookCsv";

export function ResultsPage() {
  const stats = useResultStats();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<ResultStat | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: "Results figures" }]}
        title="Results figures"
        description="The only success figures a poster may use. Any other number claimed as a result is blocked (CCPA-06)."
        actions={<RulebookActions dataset="results" canEdit={isHeadOffice} addLabel="Add figure" onAdd={() => setEditing("new")}
          onExport={() => download("results-figures.csv", statsCsv(stats.data ?? []))} />}
      />
      <QueryState
        query={stats}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No approved figures">Until head office approves a figure, posters can't claim any results.</EmptyState>}
      >
        {(data) => <StatTable stats={data} onEdit={isHeadOffice ? setEditing : undefined} />}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add figure" : "Edit figure"}>
        {editing !== null && <StatForm stat={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
