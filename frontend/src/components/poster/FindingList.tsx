import { CircleCheck } from "lucide-react";
import { useState } from "react";
import type { Channel, Finding, Severity, WordingFlag } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/States";
import type { Problem } from "@/lib/findings";
import { SEVERITY } from "@/lib/labels";
import { FindingCard } from "./FindingCard";

interface FindingListProps {
  problems: Problem[];
  passes: Finding[];
  questions: WordingFlag[];
  ruleNames: Record<string, string>;
  selected: number | null;
  onSelect: (number: number | null) => void;
  canResolve: boolean;
  canOverride: boolean;
  onResolve: (findingId: string, note: string) => void;
  onOverride: (findingId: string, note: string) => void;
  consent?: { versionId: string; channel: Channel };
  multi?: boolean;
}

const GROUPS: Exclude<Severity, "pass">[] = ["block", "needs_human", "warn"];

export function FindingList(props: FindingListProps) {
  const { problems, passes, questions, ruleNames, selected, onSelect } = props;
  const [showPasses, setShowPasses] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {problems.length === 0 && (
        <EmptyState title="No problems found" icon={CircleCheck}>
          All {passes.length} checks passed. A reviewer still makes the final call.
        </EmptyState>
      )}

      {GROUPS.map((severity) => {
        const group = problems.filter((p) => p.finding.severity === severity);
        if (group.length === 0) return null;
        return (
          <section key={severity} className="flex flex-col gap-2.5" aria-label={SEVERITY[severity].label}>
            <h2 className="text-sm text-muted-text">
              {SEVERITY[severity].label} · <span className="tabular-nums">{group.length}</span>
            </h2>
            {group.map((problem) => (
              <FindingCard
                key={problem.finding.id}
                problem={problem}
                ruleName={ruleNames[problem.finding.rule_id] ?? ""}
                selected={selected === problem.number}
                onSelect={() => onSelect(selected === problem.number ? null : problem.number)}
                canResolve={props.canResolve}
                canOverride={props.canOverride}
                onResolve={(note) => props.onResolve(problem.finding.id, note)}
                onOverride={(note) => props.onOverride(problem.finding.id, note)}
                consent={props.consent}
                pageLabel={props.multi && problem.page !== null ? `Page ${problem.page + 1}` : undefined}
              />
            ))}
          </section>
        );
      })}

      {questions.length > 0 && (
        <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4 text-sm">
          <h2 className="text-sm">Questions from the AI for the reviewer</h2>
          <p className="text-muted-text">Not findings: the AI noticed something outside its two rules. A person decides.</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {questions.map((q, i) => (
              <li key={i}>
                “{q.text}”: {q.why}
              </li>
            ))}
          </ul>
        </section>
      )}

      {passes.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowPasses(!showPasses)} aria-expanded={showPasses}>
              <CircleCheck className="text-passed" />
              {showPasses ? "Hide" : "Show"} {passes.length} passed checks
            </Button>
          </div>
          {showPasses && (
            <Reveal className="grid gap-1.5 sm:grid-cols-2">
              {passes.map((f) => (
                <p key={f.id} className="flex items-baseline gap-2 rounded-sm bg-passed-soft px-3 py-2 text-sm text-ink">
                  <span className="text-xs text-passed">{f.rule_id}</span>
                  {ruleNames[f.rule_id] ?? ""}
                </p>
              ))}
            </Reveal>
          )}
        </section>
      )}
    </div>
  );
}
