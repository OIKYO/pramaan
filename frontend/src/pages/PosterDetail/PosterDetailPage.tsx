import { useState } from "react";
import { useParams } from "react-router";
import { usePoster } from "@/api/hooks/usePoster";
import { useRules } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { PosterAction } from "@/api/types";
import { ActionBar } from "@/components/poster/ActionBar";
import { PosterWorkspace } from "@/components/poster/PosterWorkspace";
import { ReviewHistory } from "@/components/poster/ReviewHistory";
import { StatusPill } from "@/components/poster/StatusPill";
import { VersionCompare } from "@/components/poster/VersionCompare";
import { VersionSwitcher } from "@/components/poster/VersionSwitcher";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingRows } from "@/components/ui/States";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHANNEL_LABEL } from "@/lib/labels";

export function PosterDetailPage() {
  const { id = "" } = useParams();
  const profile = useProfile();
  const poster = usePoster(id);
  const rules = useRules();
  const [shown, setShown] = useState<number | null>(null);

  if (poster.isPending) return <LoadingRows rows={5} />;
  if (poster.isError) return <ErrorState error={poster.error} onRetry={() => void poster.refetch()} />;

  const detail = poster.data;
  const versionNo = shown ?? detail.current_version;
  const version = detail.versions.find((v) => v.version === versionNo) ?? detail.versions[detail.versions.length - 1];
  const ruleNames = Object.fromEntries(
    [...(rules.data?.rules ?? []), ...(rules.data?.reader_checks ?? [])].map((r) => [r.id, r.name]),
  );
  // Confirming and overriding apply to the current version only.
  const actions = (version.version === detail.current_version ? detail.allowed_actions : []) as PosterAction[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={detail.title}
        meta={
          <>
            <StatusPill status={detail.status} stage={detail.review_stage} />
            <span>
              {detail.branch_name} · {CHANNEL_LABEL[detail.channel]} · uploaded by {detail.created_by_name}
            </span>
          </>
        }
      />
      <ActionBar poster={detail} role={profile.role} />
      <Tabs defaultValue="findings">
        <TabsList>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          {detail.versions.length > 1 && <TabsTrigger value="compare">Compare versions</TabsTrigger>}
          <TabsTrigger value="history">History and comments</TabsTrigger>
        </TabsList>
        <TabsContent value="findings" className="flex flex-col gap-4 pt-4">
          <VersionSwitcher versions={detail.versions} value={versionNo} current={detail.current_version} onChange={setShown} />
          <PosterWorkspace key={version.id} title={detail.title} version={version} ruleNames={ruleNames} actions={actions} />
        </TabsContent>
        <TabsContent value="compare" className="pt-4">
          <VersionCompare versions={detail.versions} />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <ReviewHistory reviews={detail.reviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
