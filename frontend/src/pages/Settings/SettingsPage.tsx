import { useBranches, useOrganisation, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { AccountPanel } from "@/components/account/AccountPanel";
import { OrganisationPanel } from "@/components/account/OrganisationPanel";
import { PreferencesPanel } from "@/components/account/PreferencesPanel";
import { SecurityPanel } from "@/components/account/SecurityPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export function SettingsPage() {
  const profile = useProfile();
  const org = useOrganisation().data;
  const branch = useBranches().data?.find((b) => b.id === profile.branch_id)?.name;
  const region = useRegions().data?.find((r) => r.id === profile.region_id)?.name;
  const where = profile.role === "branch_staff" ? (branch ?? "") : profile.role === "regional_manager" ? `${region ?? ""} region` : "All branches";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your account, your preferences and your organisation." />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-4">
          <AccountPanel profile={profile} where={where} />
          {org && <OrganisationPanel org={org} canEdit={profile.role === "head_office"} />}
        </div>
        <div className="flex flex-col gap-4">
          <SecurityPanel />
          <PreferencesPanel />
        </div>
      </div>
    </div>
  );
}
