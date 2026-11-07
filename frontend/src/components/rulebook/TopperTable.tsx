import { useKeeps, useVocabulary } from "@/api/hooks/useCatalog";
import type { Course, Topper } from "@/api/types";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL, capitalise, formatDate } from "@/lib/labels";

interface TopperTableProps {
  toppers: Topper[];
  courses: Course[];
  onEdit?: (topper: Topper) => void;
}

/** People posters may show, and whether their consent is on file. With the exam results rulebook,
 * also their verified rank and the course they took. */
export function TopperTable({ toppers, courses, onEdit }: TopperTableProps) {
  const words = useVocabulary();
  const results = useKeeps()("rankings") || toppers.some((t) => t.rank);
  const courseName = (id: string | null) => courses.find((c) => c.id === id)?.name ?? "Not set";
  const resultColumns: Column<Topper>[] = [
    {
      header: "Result",
      cell: (t) => (t.rank ? <span className="tabular-nums">AIR {t.rank} · {t.exam} {t.exam_year}</span> : <span className="text-muted-text">Not given</span>),
    },
    { header: capitalise(words.offering), cell: (t) => courseName(t.course_id) },
  ];
  const columns: Column<Topper>[] = [
    {
      header: capitalise(words.person),
      cell: (t) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{t.full_name}</span>
          {t.is_minor && <span className="text-xs text-muted-text">Under 18 · {t.guardian_signed ? "guardian signed" : "no guardian signature"}</span>}
        </div>
      ),
    },
    ...(results ? resultColumns : []),
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
  return <DataTable caption={words.people} columns={columns} rows={toppers} rowKey={(t) => t.id} />;
}
