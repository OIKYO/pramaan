import { Link2, X } from "lucide-react";
import { useState } from "react";
import { useInvites, useRevokeInvite } from "@/api/hooks/useInvites";
import { useBranches, useRegions } from "@/api/hooks/useOrganisation";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { toast } from "@/components/ui/Toast";
import { ROLE_LABEL, formatDate } from "@/lib/labels";
import { InviteDialog } from "./InviteDialog";

export function InvitePanel() {
  const invites = useInvites();
  const revoke = useRevokeInvite();
  const branches = useBranches().data ?? [];
  const regions = useRegions().data ?? [];
  const [open, setOpen] = useState(false);
  const place = (branchId: string | null, regionId: string | null) =>
    branches.find((b) => b.id === branchId)?.name ?? (regions.find((r) => r.id === regionId)?.name ? `${regions.find((r) => r.id === regionId)?.name} region` : "All branches");
  return (
    <Panel
      title="Invite people"
      description="A link for one person: they make their own account and join with the role you chose. Links work once and expire after 7 days."
      actions={<Button size="sm" onClick={() => setOpen(true)}><Link2 /> Create invite link</Button>}
    >
      <QueryState query={invites} loadingRows={2}>
        {(list) =>
          list.length === 0 ? (
            <p className="text-muted-text">No invites waiting. Links you make show here until they're used.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {list.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                  <span className="font-medium text-ink-strong">{ROLE_LABEL[i.role]}</span>
                  <span className="text-muted-text">{place(i.branch_id ?? null, i.region_id ?? null)}{i.email ? ` · ${i.email}` : ""}</span>
                  <span className="text-xs text-muted-text">
                    by {i.created_by_name ?? "someone"} · until {formatDate(i.expires_at)}
                  </span>
                  <Button variant="ghost" size="sm" className="ml-auto" aria-label="Cancel invite"
                    onClick={() => revoke.mutate(i.id, { onSuccess: () => toast.success("Invite cancelled. The link no longer works."), onError: (e) => toast.error(e.message) })}>
                    <X /> Cancel
                  </Button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      <InviteDialog open={open} onOpenChange={setOpen} />
    </Panel>
  );
}
