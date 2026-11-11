import type { ReliabilityCheck } from "@/api/types";
import { Meter } from "@/components/ui/Meter";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { percent, plural } from "./format";

function CheckRow({ check }: { check: ReliabilityCheck }) {
  const tried = check.caught + check.missed;
  return (
    <li className="grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,15rem)] sm:items-center">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-semibold text-ink-strong">{check.id}</span>
        <span className="text-sm text-ink">{check.name}</span>
        {check.kind === "ai" && <ToneBadge tone="warning">AI</ToneBadge>}
      </div>
      {tried > 0 ? (
        <div className="flex items-center gap-3">
          <Meter value={check.caught / tried} label={`${check.id}: ${percent(check.caught / tried)} caught`} />
          <span className="w-12 shrink-0 text-right text-sm text-ink-strong tabular-nums">{percent(check.caught / tried)}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-text">
          {check.planted > 0 ? `Planted on ${plural(check.planted, "poster")}, not run yet` : "Not planted in this set"}
        </span>
      )}
      <p className="flex flex-wrap gap-x-3 text-sm text-muted-text tabular-nums">
        {tried > 0 && <span>{check.caught} of {tried} caught</span>}
        <span className={check.false_flags ? "text-blocked" : undefined}>{plural(check.false_flags, "false flag")}</span>
        {check.compared > 0 && <span>{check.consistent}/{check.compared} same each run</span>}
      </p>
    </li>
  );
}

export function CheckList({ checks }: { checks: ReliabilityCheck[] }) {
  const tried = checks.filter((c) => c.caught + c.missed > 0);
  const waiting = checks.filter((c) => c.caught + c.missed === 0 && c.planted > 0);
  const rest = checks.filter((c) => c.planted === 0);
  return (
    <section className="flex flex-col gap-4 px-5 py-8 sm:px-8 lg:px-12" aria-labelledby="by-check">
      <div className="flex max-w-3xl flex-col gap-1">
        <h2 id="by-check" className="text-2xl">By check</h2>
        <p className="text-muted-text">
          How often each check caught the problem planted for it, how often it flagged a problem that wasn't there, and whether
          repeated runs gave the same answer. {rest.length > 0 && `${plural(rest.length, "check")} had nothing planted, so only their false flags count.`}
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {[...tried, ...waiting, ...rest].map((check) => <CheckRow key={check.id} check={check} />)}
      </ul>
    </section>
  );
}
