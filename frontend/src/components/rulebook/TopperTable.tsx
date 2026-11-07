import type { Course, Topper } from "@/api/types";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL, formatDate } from "@/lib/labels";

interface TopperTableProps {
  toppers: Topper[];
  courses: Course[];
  onEdit?: (topper: Topper) => void;
}

/** Students posters may show: verified rank, the course they took, and whether consent is on file. */
export function TopperTable({ toppers, courses, onEdit }: TopperTableProps) {
  const courseName = (id: string | null) => courses.find((c) => c.id === id)?.name ?? "Not set";
  const columns: Column<Topper>[] = [
    {
      header: "Student",
      cell: (t) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{t.full_name}</span>
          {t.is_minor && <span className="text-xs text-muted-text">Under 18 · {t.guardian_signed ? "guardian signed" : "no guardian signature"}</span>}
        </div>
      ),
    },
    {
      header: "Result",
      cell: (t) => (
        <span className="tabular-nums">
          AIR {t.rank} · {t.exam} {t.exam_year}
        </span>
      ),
    },
    { header: "Course", cell: (t) => courseName(t.course_id) },
    {
      header: "Consent",
      cell: (t) =>
        t.has_consent ? (
          <div className="flex flex-col items-start gap-1">
            <ToneBadge tone="passed">On file</ToneBadge>
            <span className="text-xs text-muted-text">
              Signed {t.consent_date ? formatDate(t.consent_date) : "undated"} · {t.consent_channels.map((c) => CHANNEL_LABEL[c]).join(", ") || "no channels"}
            </span>
          </div>
        ) : (
          <ToneBadge tone="blocked">No consent</ToneBadge>
        ),
    },
    ...(onEdit
      ? [{ header: "Edit", align: "end" as const, shrink: true, cell: (t: Topper) => <Button variant="ghost" size="sm" onClick={() => onEdit(t)} aria-label={`Edit ${t.full_name}`}>Edit</Button> }]
      : []),
  ];
  return <DataTable caption="Toppers register" columns={columns} rows={toppers} rowKey={(t) => t.id} />;
}
