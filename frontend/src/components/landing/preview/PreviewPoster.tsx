import { FindingNumber } from "@/components/poster/FindingNumber";
import { cn } from "@/lib/utils";
import { FINDINGS } from "./previewData";

const TONE = {
  block: { on: "border-blocked bg-blocked/15 ring-4 ring-blocked/25", off: "border-blocked/70" },
  needs_human: { on: "border-info bg-info/15 ring-4 ring-info/25", off: "border-info/70" },
} as const;

/** The example poster with a box over each problem. Clicking a box picks its finding. */
export function PreviewPoster({ selected, onSelect }: { selected: number | null; onSelect: (n: number) => void }) {
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-md border border-line">
      <img src="/demo/poster-wrong-rank.webp" alt="A fictional Northfield Academy poster of its JEE Main 2026 toppers" width={720} height={900} className="block w-full" />
      {FINDINGS.map((f) => {
        const tone = TONE[f.severity as keyof typeof TONE];
        const on = selected === f.number;
        return (
          <button
            key={f.number}
            type="button"
            aria-label={`Problem ${f.number}: ${f.message}`}
            aria-pressed={on}
            onClick={() => onSelect(f.number)}
            className={cn("absolute cursor-pointer rounded-xs border-2 transition-shadow duration-(--duration-fast)", on ? tone.on : tone.off)}
            style={{
              top: `calc(${f.box.top}% - 4px)`,
              left: `calc(${f.box.left}% - 4px)`,
              width: `calc(${f.box.width}% + 8px)`,
              height: `calc(${f.box.height}% + 8px)`,
            }}
          >
            <span className="absolute bottom-full -left-0.5 mb-1">
              <FindingNumber number={f.number} severity={f.severity} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
