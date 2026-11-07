import { useState } from "react";
import { useResultStats } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { ResultStat } from "@/api/types";
import { StatForm } from "@/components/rulebook/StatForm";
import { StatTable } from "@/components/rulebook/StatTable";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

export function ResultsPage() {
  const stats = useResultStats();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<ResultStat | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rulebook"
        title="Results figures"
        description="The only success figures a poster may use. Any other number claimed as a result is blocked (CCPA-06)."
        actions={isHeadOffice && <Button onClick={() => setEditing("new")}>Add figure</Button>}
      />
      <QueryState
        query={stats}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No approved figures">Until head office approves a figure, posters can't claim any results figures.</EmptyState>}
      >
        {(data) => <StatTable stats={data} onEdit={isHeadOffice ? setEditing : undefined} />}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add figure" : "Edit figure"}>
        {editing !== null && <StatForm stat={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
