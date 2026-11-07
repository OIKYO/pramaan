import { useState } from "react";
import { useVocabulary } from "@/api/hooks/useCatalog";
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

/** The only figures posters may quote: results figures, impact figures, approved figures. */
export function FiguresPage() {
  const words = useVocabulary();
  const stats = useResultStats();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<ResultStat | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: words.figures }]}
        title={words.figures}
        description="The only figures a poster may quote. Any other figure is blocked until head office approves it (CCPA-06)."
        actions={<RulebookActions dataset="results" canEdit={isHeadOffice} addLabel="Add figure" onAdd={() => setEditing("new")}
          onExport={() => download("figures.csv", statsCsv(stats.data ?? []))} />}
      />
      <QueryState
        query={stats}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No approved figures">Until head office approves a figure, posters can't quote any.</EmptyState>}
      >
        {(data) => <StatTable stats={data} onEdit={isHeadOffice ? setEditing : undefined} />}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add figure" : "Edit figure"}>
        {editing !== null && <StatForm stat={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
