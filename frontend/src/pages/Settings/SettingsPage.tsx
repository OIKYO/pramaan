import { useBranches, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { AccountPanel } from "@/components/account/AccountPanel";
import { PreferencesPanel } from "@/components/account/PreferencesPanel";
import { SecurityPanel } from "@/components/account/SecurityPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export function SettingsPage() {
  const profile = useProfile();
  const branch = useBranches().data?.find((b) => b.id === profile.branch_id)?.name;
  const region = useRegions().data?.find((r) => r.id === profile.region_id)?.name;
  const where = profile.role === "branch_staff" ? (branch ?? "") : profile.role === "regional_manager" ? `${region ?? ""} region` : "All branches";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your account and how Pramaan looks for you. The organisation's own details are under Organisation › Profile." />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <AccountPanel profile={profile} where={where} />
        <div className="flex flex-col gap-4">
          <SecurityPanel />
          <PreferencesPanel />
        </div>
      </div>
    </div>
  );
}
