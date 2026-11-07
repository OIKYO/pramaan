import type { AuditEntry } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { formatDateTime } from "@/lib/labels";

/** One line on what an entry recorded: the model and image for AI calls, the note or new status otherwise. */
function summary(details: Record<string, unknown>): string {
  if (typeof details.model === "string") return `Model ${details.model}, image ${String(details.image_sha256 ?? "").slice(0, 12)}…`;
  if (typeof details.note === "string") return details.note;
  if (typeof details.to === "string") return `Now ${details.to.replace("_", " ")}`;
  return "";
}

const columns: Column<AuditEntry>[] = [
  { header: "When", shrink: true, cell: (e) => <span className="text-muted-text tabular-nums">{formatDateTime(e.created_at)}</span> },
  { header: "Who", shrink: true, cell: (e) => <span className="font-semibold text-ink-strong">{e.actor_name ?? "Pramaan"}</span> },
  {
    header: "What",
    shrink: true,
    cell: (e) => <ToneBadge tone={e.action === "ai_call" ? "warning" : "neutral"}>{e.action.replaceAll("_", " ")}</ToneBadge>,
  },
  { header: "Details", cell: (e) => <span className="break-words text-muted-text">{summary(e.details)}</span> },
];

/** Every status change and AI call, newest first. */
export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  return <DataTable caption="Audit log" columns={columns} rows={entries} rowKey={(e) => String(e.id)} />;
}
