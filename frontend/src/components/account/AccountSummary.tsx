import type { Profile } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_LABEL, formatDate } from "@/lib/labels";

/** Who you are in Pramaan. Head office changes names and roles from the Team page. */
export function AccountSummary({ profile, where }: { profile: Profile; where: string }) {
  return (
    <div className="flex items-start gap-4">
      <Avatar name={profile.full_name} />
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-sm">
        <dt className="text-muted-text">Name</dt>
        <dd className="font-medium text-ink-strong">{profile.full_name}</dd>
        <dt className="text-muted-text">Email</dt>
        <dd className="break-all text-ink-strong">{profile.email}</dd>
        <dt className="text-muted-text">Role</dt>
        <dd className="text-ink-strong">{ROLE_LABEL[profile.role]} · {where}</dd>
        <dt className="text-muted-text">Member since</dt>
        <dd className="text-ink-strong">{formatDate(profile.created_at)}</dd>
      </dl>
    </div>
  );
}
