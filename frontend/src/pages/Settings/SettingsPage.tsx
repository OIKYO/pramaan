import { useBranches, useOrganisation, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { AccountSummary } from "@/components/account/AccountSummary";
import { AppearanceSetting } from "@/components/account/AppearanceSetting";
import { OrganisationForm } from "@/components/account/OrganisationForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";

export function SettingsPage() {
  const profile = useProfile();
  const org = useOrganisation().data;
  const branch = useBranches().data?.find((b) => b.id === profile.branch_id)?.name;
  const region = useRegions().data?.find((r) => r.id === profile.region_id)?.name;
  const where = profile.role === "branch_staff" ? (branch ?? "") : profile.role === "regional_manager" ? `${region ?? ""} region` : "All branches";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your account, how Pramaan looks, and (for head office) the organisation." />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Panel title="Your account">
            <AccountSummary profile={profile} where={where} />
          </Panel>
          <Panel title="Appearance">
            <AppearanceSetting />
          </Panel>
          {profile.role === "head_office" && org && (
            <Panel title="Organisation">
              <OrganisationForm org={org} />
            </Panel>
          )}
        </div>
        <Panel title="Change password">
          <PasswordForm />
        </Panel>
      </div>
    </div>
  );
}
