import { useAuditLog } from "@/api/hooks/useInsights";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { formatDateTime } from "@/lib/labels";

function summary(details: Record<string, unknown>): string {
  if (typeof details.model === "string") return `Model ${details.model}, image ${String(details.image_sha256 ?? "").slice(0, 12)}…`;
  if (typeof details.note === "string") return details.note;
  if (typeof details.to === "string") return `Now ${details.to.replace("_", " ")}`;
  return "";
}

export function AuditPage() {
  const log = useAuditLog();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description="Every status change and every AI call, newest first. AI calls record the model, the image's hash, what was sent and when."
      />
      {log.isPending ? (
        <LoadingRows rows={8} />
      ) : log.isError ? (
        <ErrorState error={log.error} onRetry={() => void log.refetch()} />
      ) : log.data.length === 0 ? (
        <EmptyState title="Nothing logged yet">Entries appear as soon as a poster is uploaded.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>What</TableHead><TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-muted-text">{formatDateTime(entry.created_at)}</TableCell>
                  <TableCell>{entry.actor_name ?? "Pramaan"}</TableCell>
                  <TableCell>
                    <ToneBadge tone={entry.action === "ai_call" ? "warning" : "neutral"}>{entry.action.replaceAll("_", " ")}</ToneBadge>
                  </TableCell>
                  <TableCell className="max-w-md text-sm whitespace-normal text-muted-text">{summary(entry.details)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
