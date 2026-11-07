import { Highlight } from "@/components/ui/Highlight";
import type { Problem } from "@/lib/findings";
import { cn } from "@/lib/utils";

interface PosterCanvasProps {
  imageUrl: string | null;
  title: string;
  problems: Problem[];
  selected: number | null;
  onSelect: (number: number | null) => void;
}

const BOX_TONE = {
  block: "border-blocked bg-blocked/10",
  needs_human: "border-info bg-info/10",
  warn: "border-warning bg-warning/10",
  pass: "border-passed",
} as const;

const BADGE_TONE = { block: "bg-blocked", needs_human: "bg-info", warn: "bg-warning", pass: "bg-passed" } as const;

/** The poster with a numbered box over each problem. Click a box to open its finding. */
export function PosterCanvas({ imageUrl, title, problems, selected, onSelect }: PosterCanvasProps) {
  return (
    <figure className="relative overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      {imageUrl ? (
        <img src={imageUrl} alt={`Poster: ${title}`} className="block w-full" />
      ) : (
        <div className="grid aspect-[4/5] place-items-center text-sm text-muted-text">The image couldn't be loaded.</div>
      )}
      {problems.map(({ number, finding, box }) => {
        if (!box) return null;
        const [ymin, xmin, ymax, xmax] = box;
        const isSelected = selected === number;
        const settled = finding.status !== "open";
        return (
          <Highlight
            key={finding.id}
            active={isSelected}
            className="absolute"
            style={{
              top: `calc(${ymin / 10}% - 4px)`,
              left: `calc(${xmin / 10}% - 4px)`,
              width: `calc(${(xmax - xmin) / 10}% + 8px)`,
              height: `calc(${(ymax - ymin) / 10}% + 8px)`,
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(isSelected ? null : number)}
              aria-label={`Finding ${number}: ${finding.message}`}
              aria-pressed={isSelected}
              className={cn(
                "relative size-full rounded-sm border-2",
                BOX_TONE[finding.severity],
                settled && "border-dashed opacity-50",
                isSelected && "ring-4 ring-ink/30",
              )}
            >
              <span
                className={cn(
                  "absolute -top-3 -left-3 grid size-6 place-items-center rounded-full text-xs font-semibold text-white shadow",
                  BADGE_TONE[finding.severity],
                )}
              >
                {number}
              </span>
            </button>
          </Highlight>
        );
      })}
    </figure>
  );
}
