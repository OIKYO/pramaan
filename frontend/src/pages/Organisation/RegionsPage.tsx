import { useBranches, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import { useMembers } from "@/api/hooks/useTeam";
import { RegionList } from "@/components/regions/RegionList";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

/** Regions group branches: each regional manager reviews the posters of every branch in theirs. */
export function RegionsPage() {
  const regions = useRegions();
  const branches = useBranches().data ?? [];
  const members = useMembers().data ?? [];
  const isHeadOffice = useProfile().role === "head_office";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Regions" }]}
        title="Regions"
        description="Regions group your branches. A regional manager reviews the posters of every branch in their region. Move a branch to another region from the Branches page."
      />
      <QueryState
        query={regions}
        isEmpty={(data) => data.length === 0 && !isHeadOffice}
        empty={<EmptyState title="No regions yet">Head office adds regions here.</EmptyState>}
      >
        {(data) => <RegionList regions={data} branches={branches} members={members} canEdit={isHeadOffice} />}
      </QueryState>
    </div>
  );
}
