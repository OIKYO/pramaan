import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/ui/Highlight";
import { ToneBadge } from "@/components/ui/ToneBadge";
import type { Problem } from "@/lib/findings";
import { KIND_LABEL, SEVERITY } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { NoteDialog } from "./NoteDialog";

interface FindingCardProps {
  problem: Problem;
  ruleName: string;
  selected: boolean;
  onSelect: () => void;
  canResolve: boolean;
  canOverride: boolean;
  pending: boolean;
  onResolve: (note: string) => void;
  onOverride: (note: string) => void;
}

/** One problem: what's wrong, the rule it breaks and why, and how to fix it. */
export function FindingCard(props: FindingCardProps) {
  const { problem, ruleName, selected, onSelect, canResolve, canOverride, pending, onResolve, onOverride } = props;
  const { number, finding } = problem;
  const [asking, setAsking] = useState<"resolve" | "override" | null>(null);
  const severity = SEVERITY[finding.severity];
  const quoted = typeof finding.evidence?.text === "string" ? finding.evidence.text : null;
  const open = finding.status === "open";

  return (
    <Highlight active={selected}>
      <article
        onClick={onSelect}
        className={cn(
          "cursor-pointer rounded-lg border border-line bg-surface p-4 text-sm shadow-sm",
          selected && "border-ink ring-2 ring-ink/15",
          !open && "opacity-75",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{number}</span>
          <ToneBadge tone={severity.tone}>{severity.label}</ToneBadge>
          <ToneBadge tone={finding.kind === "ai" ? "warning" : "neutral"}>{KIND_LABEL[finding.kind]}</ToneBadge>
          <span className="text-muted-text">
            {finding.rule_id} · {ruleName}
          </span>
        </div>
        <p className="mt-2 font-medium text-ink">{finding.message}</p>
        {quoted && <blockquote className="mt-2 border-l-2 border-line pl-3 text-muted-text">{quoted}</blockquote>}
        {finding.suggested_fix && (
          <p className="mt-2">
            <span className="font-semibold">{finding.kind === "ai" ? "AI suggestion: " : "Fix: "}</span>
            {finding.suggested_fix.replace(/^AI suggestion:\s*/, "")}
          </p>
        )}
        <p className="mt-2 text-muted-text">
          <span className="font-semibold">Why: </span>
          {finding.reason}
        </p>
        {!open && (
          <p className="mt-2 rounded bg-ink-soft px-3 py-2">
            {finding.status === "overridden" ? "Overridden by head office: " : "Confirmed by a reviewer: "}
            {finding.override_reason}
          </p>
        )}
        {open && (canResolve || canOverride) && (
          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
            {canResolve && finding.severity === "needs_human" && (
              <Button size="sm" variant="outline" onClick={() => setAsking("resolve")}>
                Confirm reading
              </Button>
            )}
            {canOverride && finding.severity === "block" && (
              <Button size="sm" variant="outline" onClick={() => setAsking("override")}>
                Override
              </Button>
            )}
          </div>
        )}
      </article>
      <NoteDialog
        open={asking !== null}
        onOpenChange={(next) => !next && setAsking(null)}
        title={asking === "override" ? `Override finding ${number}` : `Confirm finding ${number}`}
        description={
          asking === "override"
            ? "This lets the poster be approved despite the problem. The reason goes in the audit log."
            : "Say what you checked on the poster, so others can see why this is settled."
        }
        label={asking === "override" ? "Reason for the override" : "What you checked"}
        confirmLabel={asking === "override" ? "Override" : "Confirm reading"}
        pending={pending}
        onConfirm={(note) => {
          if (asking === "override") onOverride(note);
          else onResolve(note);
          setAsking(null);
        }}
      />
    </Highlight>
  );
}
