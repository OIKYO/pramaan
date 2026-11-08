import { useOrganisation, useProfileGaps } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { OrganisationProfile } from "@/components/organisation/OrganisationProfile";
import { ProfileGapsNotice } from "@/components/organisation/ProfileGapsNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";

export function ProfilePage() {
  const org = useOrganisation();
  const gaps = useProfileGaps();
  const isHeadOffice = useProfile().role === "head_office";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Profile" }]}
        title="Organisation profile"
        description="Who you are and what you do. Everyone in your organisation works from this."
      />
      <ProfileGapsNotice gaps={gaps} />
      <QueryState query={org}>{(data) => <OrganisationProfile org={data} canEdit={isHeadOffice} />}</QueryState>
    </div>
  );
}
