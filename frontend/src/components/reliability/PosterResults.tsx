import { useState } from "react";
import type { ReliabilityPoster, ReliabilityRun } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL } from "@/lib/labels";

const right = (run: ReliabilityRun) => run.missed.length === 0 && run.extra.length === 0;

function RunBadge({ run, n }: { run: ReliabilityRun; n: number }) {
  if (right(run)) return <ToneBadge tone="passed">Run {n}: right</ToneBadge>;
  return (
    <span className="flex flex-col items-start gap-1">
      {run.missed.length > 0 && <ToneBadge tone="blocked">Run {n}: missed {run.missed.join(", ")}</ToneBadge>}
      {run.extra.length > 0 && <ToneBadge tone="warning">Run {n}: also flagged {run.extra.join(", ")}</ToneBadge>}
    </span>
  );
}

const columns: Column<ReliabilityPoster>[] = [
  {
    header: "Poster",
    cell: (p) => (
      <div className="flex items-start gap-3">
        <img src={`/${p.image}`} alt="" loading="lazy" className="h-20 w-16 shrink-0 rounded-xs border border-line object-cover" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{p.name}</span>
          <span className="text-xs text-muted-text">{CHANNEL_LABEL[p.channel]} · planted: {p.plants}</span>
        </div>
      </div>
    ),
  },
  {
    header: "Should fail",
    cell: (p) => <span className="text-sm text-ink">{p.expect.length ? p.expect.join(", ") : "Nothing"}</span>,
  },
  {
    header: "Runs",
    cell: (p) => (
      <div className="flex flex-col items-start gap-1">
        {p.runs.map((run, i) => <RunBadge key={i} run={run} n={i + 1} />)}
        {p.unread > 0 && <span className="text-xs text-muted-text">{p.unread} unread</span>}
      </div>
    ),
  },
  {
    header: "Same each run",
    shrink: true,
    cell: (p) => (p.consistent === null ? "–" : p.consistent ? "Yes" : <span className="text-blocked">No</span>),
  },
];

export function PosterResults({ results }: { results: ReliabilityPoster[] }) {
  const wrong = results.filter((p) => p.runs.some((run) => !right(run)) || p.consistent === false);
  const [show, setShow] = useState<"all" | "wrong">("all");
  return (
    <section className="flex flex-col gap-4 px-5 py-8 sm:px-8 lg:px-12" aria-labelledby="by-poster">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex max-w-3xl flex-col gap-1">
          <h2 id="by-poster" className="text-2xl">Every poster</h2>
          <p className="text-muted-text">What was planted, and what each run found. AI flags that are fair on a planted guarantee don't count against it.</p>
        </div>
        <SegmentedControl label="Which posters" value={show} onChange={setShow}
          options={[{ value: "all", label: "All", count: results.length }, { value: "wrong", label: "Not right every run", count: wrong.length }]} />
      </div>
      <DataTable caption="Every test poster and what each run found" columns={columns} rows={show === "all" ? results : wrong} rowKey={(p) => p.name} />
    </section>
  );
}
