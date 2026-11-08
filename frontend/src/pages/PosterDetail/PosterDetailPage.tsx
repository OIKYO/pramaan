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
import { StatusTrack } from "@/components/poster/StatusTrack";
import { VersionCompare } from "@/components/poster/VersionCompare";
import { VersionSwitcher } from "@/components/poster/VersionSwitcher";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHANNEL_LABEL } from "@/lib/labels";

export function PosterDetailPage() {
  const { id = "" } = useParams();
  const profile = useProfile();
  const poster = usePoster(id);
  const rules = useRules();
  const [shown, setShown] = useState<number | null>(null);
  const ruleNames = Object.fromEntries([...(rules.data?.rules ?? []), ...(rules.data?.reader_checks ?? [])].map((r) => [r.id, r.name]));

  return (
    <QueryState query={poster} loadingRows={5}>
      {(detail) => {
        const versionNo = shown ?? detail.current_version;
        const version = detail.versions.find((v) => v.version === versionNo) ?? detail.versions[detail.versions.length - 1];
        const actions = (version.version === detail.current_version ? detail.allowed_actions : []) as PosterAction[];
        return (
          <div className="flex flex-col gap-6">
            <PageHeader
              crumbs={[{ label: profile.role === "branch_staff" ? "My posters" : "All posters", to: profile.role === "branch_staff" ? "/branch" : "/posters" }, { label: detail.title }]}
              title={detail.title}
              meta={
                <>
                  <StatusPill status={detail.status} stage={detail.review_stage} />
                  <span>
                    {detail.branch_name} · {CHANNEL_LABEL[detail.channel]} · uploaded by {detail.created_by_name} · version {detail.current_version}
                  </span>
                </>
              }
              actions={<ActionBar poster={detail} role={profile.role} />}
            />
            <StatusTrack status={detail.status} stage={detail.review_stage} />
            <Tabs defaultValue="findings">
              <TabsList>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                {detail.versions.length > 1 && <TabsTrigger value="compare">Compare versions</TabsTrigger>}
                <TabsTrigger value="history">History and comments</TabsTrigger>
              </TabsList>
              <TabsContent value="findings" className="flex flex-col gap-4">
                <VersionSwitcher versions={detail.versions} value={versionNo} current={detail.current_version} onChange={setShown} />
                <PosterWorkspace key={version.id} title={detail.title} version={version} ruleNames={ruleNames} actions={actions} />
              </TabsContent>
              <TabsContent value="compare">
                <VersionCompare versions={detail.versions} />
              </TabsContent>
              <TabsContent value="history">
                <ReviewHistory reviews={detail.reviews} />
              </TabsContent>
            </Tabs>
          </div>
        );
      }}
    </QueryState>
  );
}
