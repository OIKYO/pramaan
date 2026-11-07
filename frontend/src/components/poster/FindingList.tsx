import { useState } from "react";
import type { Finding, WordingFlag } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Highlight";
import { EmptyState } from "@/components/ui/States";
import type { Problem } from "@/lib/findings";
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
  pending: boolean;
  onResolve: (findingId: string, note: string) => void;
  onOverride: (findingId: string, note: string) => void;
}

/** Problems first (numbered to match the poster), then the AI's questions, then passed checks. */
export function FindingList(props: FindingListProps) {
  const { problems, passes, questions, ruleNames, selected, onSelect } = props;
  const [showPasses, setShowPasses] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {problems.length === 0 ? (
        <EmptyState title="No problems found">All {passes.length} checks passed. A reviewer still makes the final call.</EmptyState>
      ) : (
        problems.map((problem) => (
          <FindingCard
            key={problem.finding.id}
            problem={problem}
            ruleName={ruleNames[problem.finding.rule_id] ?? ""}
            selected={selected === problem.number}
            onSelect={() => onSelect(selected === problem.number ? null : problem.number)}
            canResolve={props.canResolve}
            canOverride={props.canOverride}
            pending={props.pending}
            onResolve={(note) => props.onResolve(problem.finding.id, note)}
            onOverride={(note) => props.onOverride(problem.finding.id, note)}
          />
        ))
      )}

      {questions.length > 0 && (
        <section className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <h3 className="text-base">Questions from the AI for the reviewer</h3>
          <p className="text-muted-text">These aren't findings: the AI noticed something outside its two rules. A person decides.</p>
          <ul className="mt-2 list-disc pl-5">
            {questions.map((q, i) => (
              <li key={i}>
                “{q.text}”: {q.why}
              </li>
            ))}
          </ul>
        </section>
      )}

      {passes.length > 0 && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowPasses(!showPasses)} aria-expanded={showPasses}>
            {showPasses ? "Hide" : "Show"} {passes.length} passed checks
          </Button>
          {showPasses && (
            <Reveal className="mt-2 grid gap-1 sm:grid-cols-2">
              {passes.map((f) => (
                <p key={f.id} className="rounded bg-passed-soft px-3 py-1.5 text-sm text-ink">
                  <span className="font-medium text-passed">{f.rule_id}</span> {ruleNames[f.rule_id] ?? ""}
                </p>
              ))}
            </Reveal>
          )}
        </div>
      )}
    </div>
  );
}
