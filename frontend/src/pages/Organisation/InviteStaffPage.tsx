import { JoinCodePanel } from "@/components/organisation/JoinCodePanel";
import { InvitePanel } from "@/components/team/InvitePanel";
import { PageHeader } from "@/components/ui/PageHeader";

export function InviteStaffPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invite staff"
        description="Bring branch staff into your region. Send someone an invite link, or give them the join code to enter when they sign up."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <InvitePanel />
        <JoinCodePanel canRefresh={false} />
      </div>
    </div>
  );
}
