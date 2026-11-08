import { useState } from "react";
import { useBranches, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import type { Branch } from "@/api/types";
import { BranchForm } from "@/components/branches/BranchForm";
import { BranchTable } from "@/components/branches/BranchTable";
import { RulebookActions } from "@/components/rulebook/RulebookActions";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";
import { TextLink } from "@/components/ui/TextLink";
import { download } from "@/lib/csv";
import { branchesCsv } from "@/lib/rulebookCsv";

export function BranchesPage() {
  const branches = useBranches();
  const regions = useRegions();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const regionList = regions.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Branches" }]}
        title="Branches"
        description={<>Your branches. Each branch's phone and address are checked on its posters (FACT-03). Regions are on the <TextLink to="/organisation/regions">Regions</TextLink> page.</>}
        actions={<RulebookActions dataset="branches" canEdit={isHeadOffice} addLabel="Add branch" onAdd={() => setEditing("new")}
          onExport={() => download("branches.csv", branchesCsv(branches.data ?? [], regionList))} />}
      />
      <QueryState
        query={branches}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState title="No branches yet">
            Add a <TextLink to="/organisation/regions">region</TextLink> first, then your branches, or import them from a spreadsheet.
          </EmptyState>
        }
      >
        {(data) => <BranchTable branches={data} regions={regionList} onEdit={isHeadOffice ? setEditing : undefined} />}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add branch" : "Edit branch"}>
        {editing !== null && <BranchForm branch={editing === "new" ? null : editing} regions={regionList} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
