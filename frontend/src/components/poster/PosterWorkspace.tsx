import { useState } from "react";
import { useOverrideFinding, useResolveFinding } from "@/api/hooks/usePoster";
import type { PosterAction, Version } from "@/api/types";
import { toast } from "@/components/ui/Toast";
import { passesOf, problemsOf } from "@/lib/findings";
import { scrollToItem } from "@/lib/motion";
import { FindingList } from "./FindingList";
import { PosterCanvas } from "./PosterCanvas";
import { VerdictSummary } from "./VerdictSummary";

interface PosterWorkspaceProps {
  title: string;
  version: Version;
  ruleNames: Record<string, string>;
  actions: PosterAction[];
}

export function PosterWorkspace({ title, version, ruleNames, actions }: PosterWorkspaceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const resolve = useResolveFinding();
  const override = useOverrideFinding();
  const problems = problemsOf(version);
  const onError = (error: Error) => toast.error(error.message);

  const pickOnPoster = (number: number | null) => {
    setSelected(number);
    if (number !== null) scrollToItem(document.getElementById(`finding-${number}`));
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
      <div className="flex flex-col gap-2 lg:sticky lg:top-6">
        <PosterCanvas imageUrl={version.image_url} title={title} problems={problems} selected={selected} onSelect={pickOnPoster} />
        <p className="text-xs text-muted-text">
          Version {version.version} · read by {version.reader_model ?? "nobody (the reader failed)"}
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <VerdictSummary version={version} />
        <FindingList
          problems={problems}
          passes={passesOf(version)}
          questions={version.questions ?? []}
          ruleNames={ruleNames}
          selected={selected}
          onSelect={setSelected}
          canResolve={actions.includes("resolve")}
          canOverride={actions.includes("override")}
          onResolve={(findingId, note) => resolve.mutate({ findingId, note }, { onSuccess: () => toast.success("Reading confirmed."), onError })}
          onOverride={(findingId, note) => override.mutate({ findingId, note }, { onSuccess: () => toast.success("Finding overridden."), onError })}
        />
      </div>
    </div>
  );
}
