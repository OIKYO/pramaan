import { KeyRound, MoreHorizontal, Pencil, UserCheck, UserX } from "lucide-react";
import type { Branch, Profile, Region } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Menu } from "@/components/ui/Menu";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { ROLE_LABEL } from "@/lib/labels";

interface TeamTableProps {
  members: Profile[];
  branches: Branch[];
  regions: Region[];
  myId: string;
  onEdit: (member: Profile) => void;
  onResetPassword: (member: Profile) => void;
  onSetAccess: (member: Profile, active: boolean) => void;
}

/** Everyone in the organisation: role, where they work, and whether they can sign in. */
export function TeamTable({ members, branches, regions, myId, onEdit, onResetPassword, onSetAccess }: TeamTableProps) {
  const where = (m: Profile) =>
    m.role === "branch_staff"
      ? (branches.find((b) => b.id === m.branch_id)?.name ?? "No branch")
      : m.role === "regional_manager"
        ? `${regions.find((r) => r.id === m.region_id)?.name ?? "No"} region`
        : "All branches";

  const columns: Column<Profile>[] = [
    {
      header: "Person",
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.full_name} />
          <div className="flex min-w-0 flex-col">
            <span className="font-medium text-ink-strong">
              {m.full_name}
              {m.id === myId && <span className="font-normal text-muted-text"> (you)</span>}
            </span>
            <span className="truncate text-xs text-muted-text">{m.email}</span>
          </div>
        </div>
      ),
    },
    { header: "Role", cell: (m) => ROLE_LABEL[m.role] },
    { header: "Works in", cell: where },
    {
      header: "Status",
      cell: (m) =>
        m.deactivated_at ? (
          <ToneBadge tone="neutral">Access removed</ToneBadge>
        ) : m.needs_password_change ? (
          <ToneBadge tone="warning" dot>Hasn't signed in yet</ToneBadge>
        ) : (
          <ToneBadge tone="passed" dot>Active</ToneBadge>
        ),
    },
    {
      header: "Actions",
      align: "end",
      shrink: true,
      cell: (m) => (
        <Menu
          label={m.full_name}
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.full_name}`}>
              <MoreHorizontal />
            </Button>
          }
          items={[
            { label: "Edit role and branch", icon: Pencil, onSelect: () => onEdit(m) },
            { label: "Reset password", icon: KeyRound, onSelect: () => onResetPassword(m), disabled: Boolean(m.deactivated_at) },
            "separator",
            m.deactivated_at
              ? { label: "Restore access", icon: UserCheck, onSelect: () => onSetAccess(m, true) }
              : { label: "Remove access", icon: UserX, danger: true, disabled: m.id === myId, onSelect: () => onSetAccess(m, false) },
          ]}
        />
      ),
    },
  ];
  return <DataTable caption="Team" columns={columns} rows={members} rowKey={(m) => m.id} muted={(m) => Boolean(m.deactivated_at)} />;
}
