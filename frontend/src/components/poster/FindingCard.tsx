import { Crosshair } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ui/ToneBadge";
import type { Problem } from "@/lib/findings";
import { KIND_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { FindingNumber } from "./FindingNumber";
import { NoteDialog } from "./NoteDialog";

interface FindingCardProps {
  problem: Problem;
  ruleName: string;
  selected: boolean;
  onSelect: () => void;
  canResolve: boolean;
  canOverride: boolean;
  onResolve: (note: string) => void;
  onOverride: (note: string) => void;
}

/** One problem: what's wrong, the rule it breaks and why, and how to fix it. */
export function FindingCard({ problem, ruleName, selected, onSelect, canResolve, canOverride, onResolve, onOverride }: FindingCardProps) {
  const { number, finding, box } = problem;
  const [asking, setAsking] = useState<"resolve" | "override" | null>(null);
  const quoted = typeof finding.evidence?.text === "string" ? finding.evidence.text : null;
  const open = finding.status === "open";
  const ai = finding.kind === "ai";
  const fix = finding.suggested_fix?.replace(/^AI suggestion:\s*/, "");

  return (
    <article
      id={`finding-${number}`}
      onClick={box ? onSelect : undefined}
      className={cn(
        "flex scroll-mt-24 flex-col gap-3 rounded-md border bg-surface p-4 text-sm",
        selected ? "border-action ring-1 ring-action" : "border-line",
        box && !selected && "cursor-pointer hover:border-line-strong",
      )}
    >
      <header className="flex items-start gap-3">
        <FindingNumber number={number} severity={finding.severity} muted={!open} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex flex-wrap gap-x-2 text-xs text-muted-text">
            <span className="font-mono">{finding.rule_id}</span>
            <span>{ruleName}</span>
          </p>
          <h3 className="text-base leading-snug text-pretty">{finding.message}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ToneBadge tone={ai ? "warning" : "neutral"}>{KIND_LABEL[finding.kind]}</ToneBadge>
          {!open && <ToneBadge tone="passed">{finding.status === "overridden" ? "Overridden" : "Confirmed"}</ToneBadge>}
        </div>
      </header>

      {quoted && <blockquote className="rounded-sm border-l-2 border-line-strong bg-surface-sunken/60 px-3 py-2 text-ink">“{quoted}”</blockquote>}

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
        {fix && (
          <>
            <dt className="font-semibold text-ink-strong">{ai ? "AI suggests" : "Fix"}</dt>
            <dd className="text-ink-strong">{fix}</dd>
          </>
        )}
        <dt className="font-semibold text-muted-text">Why</dt>
        <dd className="text-muted-text">{finding.reason}</dd>
        {!open && finding.override_reason && (
          <>
            <dt className="font-semibold text-muted-text">Note</dt>
            <dd className="text-ink">{finding.override_reason}</dd>
          </>
        )}
      </dl>

      {(box || (open && (canResolve || canOverride))) && (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {box && (
            <Button size="sm" variant="ghost" aria-pressed={selected} onClick={onSelect}>
              <Crosshair /> {selected ? "Shown on the poster" : "Show on the poster"}
            </Button>
          )}
          {open && canResolve && finding.severity === "needs_human" && (
            <Button size="sm" variant="secondary" onClick={() => setAsking("resolve")}>
              Confirm reading
            </Button>
          )}
          {open && canOverride && finding.severity === "block" && (
            <Button size="sm" variant="danger" onClick={() => setAsking("override")}>
              Override
            </Button>
          )}
        </div>
      )}

      <NoteDialog
        open={asking !== null}
        onOpenChange={(next) => !next && setAsking(null)}
        title={asking === "override" ? `Override finding ${number}` : `Confirm finding ${number}`}
        description={
          asking === "override"
            ? "This lets the poster be approved despite the problem. Your reason goes in the audit log."
            : "Say what you checked on the poster, so others can see why this is settled."
        }
        label={asking === "override" ? "Reason for the override" : "What you checked"}
        confirmLabel={asking === "override" ? "Override" : "Confirm reading"}
        pending={false}
        onConfirm={(note) => {
          if (asking === "override") onOverride(note);
          else onResolve(note);
          setAsking(null);
        }}
      />
    </article>
  );
}
