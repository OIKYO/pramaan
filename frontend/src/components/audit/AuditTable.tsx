import type { AuditEntry } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { auditLabel, formatDateTime } from "@/lib/labels";

/** One line on what an entry recorded: the model and image for AI calls, a note or the new state otherwise. */
function summary(details: Record<string, unknown>): string {
  if (typeof details.model === "string") return `Model ${details.model}, image ${String(details.image_sha256 ?? "").slice(0, 12)}…`;
  if (typeof details.note === "string") return details.note;
  if (typeof details.email === "string") return details.email;
  if (typeof details.file === "string") return `${details.file}: ${details.created ?? 0} added, ${details.updated ?? 0} updated`;
  if (typeof details.to === "string") return `Now ${details.to.replace("_", " ")}`;
  return "";
}

const columns: Column<AuditEntry>[] = [
  { header: "When", shrink: true, cell: (e) => <span className="text-xs text-muted-text tabular-nums">{formatDateTime(e.created_at)}</span> },
  { header: "Who", shrink: true, cell: (e) => <span className="font-medium text-ink-strong">{e.actor_name ?? "Pramaan"}</span> },
  {
    header: "What",
    cell: (e) => (
      <span className="flex flex-wrap items-center gap-2">
        {auditLabel(e.action)}
        {e.action === "ai_call" && <ToneBadge tone="warning">AI</ToneBadge>}
      </span>
    ),
  },
  { header: "Details", cell: (e) => <span className="wrap-break-word text-muted-text">{summary(e.details)}</span> },
];

/** Every status change, AI call and team or data change, newest first. */
export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  return <DataTable caption="Audit log" columns={columns} rows={entries} rowKey={(e) => String(e.id)} />;
}
