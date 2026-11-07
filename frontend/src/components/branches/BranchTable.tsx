import type { Branch, Region } from "@/api/types";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/DataTable";

/** The organisation's branches, with the contact details their posters are checked against. */
export function BranchTable({ branches, regions, onEdit }: { branches: Branch[]; regions: Region[]; onEdit?: (branch: Branch) => void }) {
  const columns: Column<Branch>[] = [
    {
      header: "Branch",
      cell: (b) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink-strong">{b.name}</span>
          <span className="text-xs text-muted-text">{b.city}</span>
        </div>
      ),
    },
    { header: "Region", cell: (b) => regions.find((r) => r.id === b.region_id)?.name ?? "" },
    { header: "Phone on posters", cell: (b) => <span className="text-xs text-ink-strong">{b.phone}</span> },
    { header: "Address", cell: (b) => <span className="text-muted-text">{b.address}</span> },
    ...(onEdit
      ? [{ header: "Edit", align: "end" as const, shrink: true, cell: (b: Branch) => (
          <Button variant="ghost" size="sm" onClick={() => onEdit(b)} aria-label={`Edit ${b.name}`}>Edit</Button>
        ) }]
      : []),
  ];
  return <DataTable caption="Branches" columns={columns} rows={branches} rowKey={(b) => b.id} />;
}
