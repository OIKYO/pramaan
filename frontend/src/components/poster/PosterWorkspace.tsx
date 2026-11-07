import { useState } from "react";
import { useOverrideFinding, useResolveFinding } from "@/api/hooks/usePoster";
import type { PosterAction, Version } from "@/api/types";
import { toast } from "@/components/ui/Toast";
import { passesOf, problemsOf } from "@/lib/findings";
import { FindingList } from "./FindingList";
import { PosterCanvas } from "./PosterCanvas";

interface PosterWorkspaceProps {
  title: string;
  version: Version;
  ruleNames: Record<string, string>;
  actions: PosterAction[];
}

/** The hero of the app: the poster with numbered boxes, beside the findings that explain them. */
export function PosterWorkspace({ title, version, ruleNames, actions }: PosterWorkspaceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const resolve = useResolveFinding();
  const override = useOverrideFinding();
  const problems = problemsOf(version);
  const onError = (error: Error) => toast.error(error.message);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="lg:sticky lg:top-6">
        <PosterCanvas imageUrl={version.image_url} title={title} problems={problems} selected={selected} onSelect={setSelected} />
        <p className="mt-2 text-xs text-muted-text">
          Version {version.version} · read by {version.reader_model ?? "nobody (the reader failed)"}
        </p>
      </div>
      <FindingList
        problems={problems}
        passes={passesOf(version)}
        questions={version.questions ?? []}
        ruleNames={ruleNames}
        selected={selected}
        onSelect={setSelected}
        canResolve={actions.includes("resolve")}
        canOverride={actions.includes("override")}
        pending={resolve.isPending || override.isPending}
        onResolve={(findingId, note) =>
          resolve.mutate({ findingId, note }, { onSuccess: () => toast.success("Reading confirmed."), onError })
        }
        onOverride={(findingId, note) =>
          override.mutate({ findingId, note }, { onSuccess: () => toast.success("Finding overridden."), onError })
        }
      />
    </div>
  );
}
