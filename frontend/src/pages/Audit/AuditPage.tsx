import { useAuditLog } from "@/api/hooks/useInsights";
import { AuditTable } from "@/components/audit/AuditTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

export function AuditPage() {
  const log = useAuditLog();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Head office"
        title="Audit log"
        description="Every status change and every AI call, newest first. AI calls record the model, the image's hash, what was sent and when."
      />
      <QueryState
        query={log}
        loadingRows={8}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="Nothing logged yet">Entries appear as soon as a poster is uploaded.</EmptyState>}
      >
        {(entries) => <AuditTable entries={entries} />}
      </QueryState>
    </div>
  );
}
