import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FindingNumber } from "@/components/poster/FindingNumber";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { cn } from "@/lib/utils";
import { FINDINGS, PASSED } from "./previewData";

/** The example's findings. Clicking one picks it (and its box on the poster); the passed checks open
 * into a list. */
export function PreviewFindings({ selected, onSelect }: { selected: number | null; onSelect: (n: number) => void }) {
  const [showPassed, setShowPassed] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      {FINDINGS.map((f) => {
        const on = selected === f.number;
        return (
          <button
            key={f.number}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(f.number)}
            className={cn(
              "flex cursor-pointer flex-col gap-1.5 rounded-lg border bg-surface p-4 text-left transition-colors duration-(--duration-fast)",
              on ? "border-ink-strong" : "border-line hover:border-line-strong",
            )}
          >
            <span className="flex items-center gap-2">
              <FindingNumber number={f.number} severity={f.severity} muted={!on} />
              <span className="text-xs text-muted-text">{f.rule}</span>
            </span>
            <span className="font-medium text-ink-strong">{f.message}</span>
            {f.severity === "block" ? (
              <span className="text-ink"><span className="font-medium text-ink-strong">Fix</span> {f.fix}</span>
            ) : (
              <span className="text-muted-text">{f.fix}</span>
            )}
          </button>
        );
      })}
      <div className="rounded-lg border border-line">
        <button
          type="button"
          aria-expanded={showPassed}
          onClick={() => setShowPassed(!showPassed)}
          className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
        >
          <ToneBadge tone="passed">{PASSED.length} passed</ToneBadge>
          <span className="flex-1 truncate text-muted-text">Consent, fees, course details, logo, colours, contrast, alt text…</span>
          <ChevronDown className={cn("size-4 text-muted-text", showPassed && "rotate-180")} aria-hidden />
        </button>
        {showPassed && (
          <ul className="grid gap-x-6 gap-y-1.5 border-t border-line p-4 text-xs text-ink sm:grid-cols-2">
            {PASSED.map((name) => (
              <li key={name} className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-passed" />
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
