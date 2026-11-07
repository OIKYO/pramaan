import { Download, FileUp, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useBranches, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { useAddMember, useMembers, useResetPassword, useSetAccess, useUpdateMember } from "@/api/hooks/useTeam";
import type { MemberCreated, Profile } from "@/api/types";
import { InvitePanel } from "@/components/team/InvitePanel";
import { MemberDialog } from "@/components/team/MemberDialog";
import { PasswordIssued } from "@/components/team/PasswordIssued";
import { TeamTable } from "@/components/team/TeamTable";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { toast } from "@/components/ui/Toast";
import { download } from "@/lib/csv";
import { membersCsv } from "@/lib/rulebookCsv";

export function TeamPage() {
  const me = useProfile();
  const members = useMembers();
  const branches = useBranches().data ?? [];
  const regions = useRegions().data ?? [];
  const add = useAddMember();
  const update = useUpdateMember();
  const reset = useResetPassword();
  const access = useSetAccess();
  const [editing, setEditing] = useState<Profile | "new" | null>(null);
  const [issued, setIssued] = useState<MemberCreated | null>(null);
  const onError = (e: Error) => toast.error(e.message);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Team" }]}
        title="Team"
        description="Everyone who uses Pramaan in your organisation. Invite people with a link, or add them yourself with a temporary password."
        actions={
          <>
            <Button variant="ghost" onClick={() => download("team.csv", membersCsv(members.data ?? [], branches, regions))}>
              <Download /> Export CSV
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/organisation/import?dataset=members"><FileUp /> Import CSV</Link>
            </Button>
            <Button onClick={() => setEditing("new")}><Plus /> Add person</Button>
          </>
        }
      />
      <InvitePanel />
      <QueryState query={members}>
        {(data) => (
          <TeamTable
            members={data}
            branches={branches}
            regions={regions}
            myId={me.id}
            onEdit={setEditing}
            onResetPassword={(m) => reset.mutate(m.id, { onSuccess: setIssued, onError })}
            onSetAccess={(m, active) =>
              access.mutate({ id: m.id, active }, {
                onSuccess: () => toast.success(active ? `${m.full_name} can sign in again.` : `${m.full_name} can no longer sign in.`),
                onError,
              })
            }
          />
        )}
      </QueryState>
      {editing !== null && (
        <MemberDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          member={editing === "new" ? null : editing}
          branches={branches}
          regions={regions}
          pending={add.isPending || update.isPending}
          onSubmit={(input) => {
            if (editing === "new") {
              add.mutate(input, { onSuccess: (result) => { setEditing(null); setIssued(result); }, onError });
              return;
            }
            const { full_name, role, branch_id, region_id } = input;
            update.mutate({ id: editing.id, full_name, role, branch_id, region_id }, { onSuccess: () => toast.success("Saved."), onError });
            setEditing(null);
          }}
        />
      )}
      <PasswordIssued issued={issued} onClose={() => setIssued(null)} />
    </div>
  );
}
