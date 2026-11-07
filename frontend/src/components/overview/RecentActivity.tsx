import { Link } from "react-router";
import { useAuditLog } from "@/api/hooks/useInsights";
import { Avatar } from "@/components/ui/Avatar";
import { Panel } from "@/components/ui/Panel";
import { LoadingRows } from "@/components/ui/States";
import { auditLabel, formatDateTime } from "@/lib/labels";

/** The latest things that happened in the organisation. */
export function RecentActivity() {
  const log = useAuditLog();
  return (
    <Panel
      title="Recent activity"
      actions={
        <Link to="/audit" className="text-xs font-medium text-muted-text hover:text-ink-strong">
          Open audit log
        </Link>
      }
    >
      {log.isPending ? (
        <LoadingRows rows={4} />
      ) : !log.data || log.data.length === 0 ? (
        <p className="text-muted-text">Nothing yet. Activity shows here once posters are uploaded.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {log.data.slice(0, 7).map((entry) => (
            <li key={entry.id} className="flex items-center gap-3">
              <Avatar name={entry.actor_name ?? "Pramaan"} size="sm" />
              <p className="min-w-0 flex-1 truncate">
                <span className="font-medium text-ink-strong">{entry.actor_name ?? "Pramaan"}</span> {auditLabel(entry.action)}
              </p>
              <span className="shrink-0 text-xs text-muted-text tabular-nums">{formatDateTime(entry.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
