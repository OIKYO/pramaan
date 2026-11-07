import type { ResultStat } from "@/api/types";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatDate } from "@/lib/labels";

/** The only results figures a poster may claim, with their source. */
export function StatTable({ stats, onEdit }: { stats: ResultStat[]; onEdit?: (stat: ResultStat) => void }) {
  const columns: Column<ResultStat>[] = [
    { header: "Figure", shrink: true, cell: (s) => <span className=" text-2xl font-medium text-ink-strong tabular-nums">{s.value}</span> },
    {
      header: "What it counts",
      cell: (s) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{s.label}</span>
          <span className="text-xs text-muted-text">
            {s.exam} {s.year}
          </span>
        </div>
      ),
    },
    { header: "Source", cell: (s) => <span className="text-muted-text">{s.source || "Not given"}</span> },
    { header: "Approved until", cell: (s) => (s.valid_until ? formatDate(s.valid_until) : <span className="text-muted-text">No end date</span>) },
    ...(onEdit
      ? [{ header: "Edit", align: "end" as const, shrink: true, cell: (s: ResultStat) => <Button variant="ghost" size="sm" onClick={() => onEdit(s)} aria-label={`Edit ${s.label}`}>Edit</Button> }]
      : []),
  ];
  return <DataTable caption="Approved results figures" columns={columns} rows={stats} rowKey={(s) => s.id} />;
}
