import { Highlight } from "@/components/ui/Highlight";
import type { Box, Problem } from "@/lib/findings";
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

/** Findings that point at the same spot share one box. Bigger boxes are drawn first, so a small
 * box inside a bigger one (a rank inside a topper's card) stays on top and clickable. */
function groupByBox(problems: Problem[]): { box: Box; items: Problem[] }[] {
  const groups = new Map<string, { box: Box; items: Problem[] }>();
  for (const p of problems) {
    if (!p.box) continue;
    const key = p.box.join(",");
    groups.set(key, { box: p.box, items: [...(groups.get(key)?.items ?? []), p] });
  }
  const area = ([y0, x0, y1, x1]: Box) => (y1 - y0) * (x1 - x0);
  return [...groups.values()].sort((a, b) => area(b.box) - area(a.box));
}

/** The poster with a numbered box over each problem. Click a box to open its finding. */
export function PosterCanvas({ imageUrl, title, problems, selected, onSelect }: PosterCanvasProps) {
  return (
    <figure className="relative overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      {imageUrl ? (
        <img src={imageUrl} alt={`Poster: ${title}`} className="block w-full" />
      ) : (
        <div className="grid aspect-[4/5] place-items-center text-sm text-muted-text">The image couldn't be loaded.</div>
      )}
      {groupByBox(problems).map(({ box, items }) => {
        const [ymin, xmin, ymax, xmax] = box;
        const at = items.findIndex((p) => p.number === selected);
        const top = items[0].finding; // most serious first
        // Clicking a shared box steps through its findings, then deselects.
        const next = at === -1 ? items[0].number : (items[at + 1]?.number ?? null);
        return (
          <Highlight
            key={box.join(",")}
            active={at !== -1}
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
              onClick={() => onSelect(next)}
              aria-label={items.map((p) => `Finding ${p.number}: ${p.finding.message}`).join(" ")}
              aria-pressed={at !== -1}
              className={cn(
                "relative size-full rounded-sm border-2",
                BOX_TONE[top.severity],
                items.every((p) => p.finding.status !== "open") && "border-dashed opacity-50",
                at !== -1 && "ring-4 ring-ink/30",
              )}
            >
              <span className="absolute -top-3 -left-3 flex gap-0.5">
                {items.map((p) => (
                  <span
                    key={p.number}
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs font-semibold text-white shadow",
                      BADGE_TONE[p.finding.severity],
                    )}
                  >
                    {p.number}
                  </span>
                ))}
              </span>
            </button>
          </Highlight>
        );
      })}
    </figure>
  );
}
