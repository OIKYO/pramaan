import { useBrandKit } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { BrandKitEditor } from "@/components/rulebook/BrandKitEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { formatDateTime } from "@/lib/labels";

export function BrandKitPage() {
  const kit = useBrandKit();
  const isHeadOffice = useProfile().role === "head_office";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: "Brand kit" }]}
        title="Brand kit"
        description="What every poster must carry, and the colours and tone it should use."
        meta={kit.data && <span>Last changed {formatDateTime(kit.data.updated_at)}</span>}
      />
      <QueryState query={kit}>{(data) => <BrandKitEditor kit={data} canEdit={isHeadOffice} />}</QueryState>
    </div>
  );
}
