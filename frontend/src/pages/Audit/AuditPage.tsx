import { useAuditLog } from "@/api/hooks/useInsights";
import { AuditBrowser } from "@/components/audit/AuditBrowser";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

export function AuditPage() {
  const log = useAuditLog();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Audit log" }]}
        title="Audit log"
        description="Every status change, AI call, and team or data change, newest first. AI calls record the model, the image's hash and when; consent files are never sent."
      />
      <QueryState
        query={log}
        loadingRows={8}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="Nothing logged yet">Entries appear as soon as something happens.</EmptyState>}
      >
        {(entries) => <AuditBrowser entries={entries} />}
      </QueryState>
    </div>
  );
}
