import { useState } from "react";
import { useOverrideFinding, useResolveFinding } from "@/api/hooks/usePoster";
import { useProfile } from "@/api/hooks/useSession";
import type { Channel, PosterAction, Version } from "@/api/types";
import { toast } from "@/components/ui/Toast";
import { pagesOf, passesOf, problemsOf } from "@/lib/findings";
import { scrollToItem } from "@/lib/motion";
import { ChecksRunning } from "./ChecksRunning";
import { FindingList } from "./FindingList";
import { PageStrip } from "./PageStrip";
import { PosterCanvas } from "./PosterCanvas";
import { VerdictSummary } from "./VerdictSummary";

interface PosterWorkspaceProps {
  title: string;
  version: Version;
  ruleNames: Record<string, string>;
  actions: PosterAction[];
  channel: Channel;
  current: boolean;
}

export function PosterWorkspace({ title, version, ruleNames, actions, channel, current }: PosterWorkspaceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const resolve = useResolveFinding();
  const override = useOverrideFinding();
  const problems = problemsOf(version);
  const onError = (error: Error) => toast.error(error.message);
  const headOffice = useProfile().role === "head_office";
  const pageList = pagesOf(version);
  const multi = pageList.length > 1;
  const checking = version.checked_at === null;
  const [page, setPage] = useState(0);
  const pickInList = (number: number | null) => {
    setSelected(number);
    const picked = problems.find((p) => p.number === number);
    if (picked && picked.page !== null && picked.box) setPage(picked.page);
  };

  const pickOnPoster = (number: number | null) => {
    setSelected(number);
    if (number !== null) scrollToItem(document.getElementById(`finding-${number}`));
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
      <div className="flex flex-col gap-2 lg:sticky lg:top-6">
        {multi && (
          <PageStrip pages={pageList} problems={problems} value={page}
            onChange={(next) => {
              setPage(next);
              setSelected(null);
            }} />
        )}
        <PosterCanvas imageUrl={pageList[page]?.image_url ?? null} title={multi ? `${title}, page ${page + 1}` : title}
          problems={problems.filter((p) => (p.page ?? 0) === page)} selected={selected} onSelect={pickOnPoster} />
        <p className="text-xs text-muted-text">
          Version {version.version}
          {multi ? ` · ${pageList.length} pages, ${version.source === "pdf" ? "a PDF brochure" : "a carousel"}` : ""} ·{" "}
          {checking ? "being read now" : `read by ${version.reader_model ?? "nobody (the reader failed)"}`}
        </p>
      </div>
      {checking ? <ChecksRunning pages={pageList.length} /> : (
      <div className="flex min-w-0 flex-col gap-5">
        <VerdictSummary version={version} />
        <FindingList
          problems={problems}
          passes={passesOf(version)}
          questions={version.questions ?? []}
          ruleNames={ruleNames}
          selected={selected}
          onSelect={pickInList}
          multi={multi}
          canResolve={actions.includes("resolve")}
          canOverride={actions.includes("override")}
          onResolve={(findingId, note) => resolve.mutate({ findingId, note }, { onSuccess: () => toast.success("Reading confirmed."), onError })}
          onOverride={(findingId, note) => override.mutate({ findingId, note }, { onSuccess: () => toast.success("Finding overridden."), onError })}
          consent={headOffice && current ? { versionId: version.id, channel } : undefined}
        />
      </div>
      )}
    </div>
  );
}
