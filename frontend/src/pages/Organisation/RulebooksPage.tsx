import { useOrganisation } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { RulebookList } from "@/components/organisation/RulebookList";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";

export function RulebooksPage() {
  const org = useOrganisation();
  const isHeadOffice = useProfile().role === "head_office";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Rulebooks" }]}
        title="Rulebooks"
        description="Each rulebook holds records you approve and the checks that use them. Checks in a rulebook you remove stop running on new posters; nothing you've added is deleted."
      />
      <QueryState query={org} loadingRows={6}>
        {(data) => <RulebookList org={data} canEdit={isHeadOffice} />}
      </QueryState>
    </div>
  );
}
