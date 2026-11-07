import type { Course } from "@/api/types";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatDate, formatInr } from "@/lib/labels";

/** Approved courses with duration, fee and expiry. Head office can edit each one. */
export function CourseTable({ courses, onEdit }: { courses: Course[]; onEdit?: (course: Course) => void }) {
  const columns: Column<Course>[] = [
    {
      header: "Course",
      cell: (c) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{c.name}</span>
          {c.aliases.length > 0 && <span className="text-xs text-muted-text">Also written as {c.aliases.join(", ")}</span>}
        </div>
      ),
    },
    { header: "Duration", cell: (c) => c.duration_label },
    { header: "Fee", cell: (c) => <span className="tabular-nums">{c.is_paid && c.fee_inr ? formatInr(c.fee_inr) : "Free"}</span> },
    { header: "Approved until", cell: (c) => (c.valid_until ? formatDate(c.valid_until) : <span className="text-muted-text">No end date</span>) },
    ...(onEdit
      ? [{ header: "Edit", align: "end" as const, shrink: true, cell: (c: Course) => <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}>Edit</Button> }]
      : []),
  ];
  return <DataTable caption="Approved courses and fees" columns={columns} rows={courses} rowKey={(c) => c.id} />;
}
