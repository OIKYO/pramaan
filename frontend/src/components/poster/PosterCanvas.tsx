import type { Box, Problem } from "@/lib/findings";
import { cn } from "@/lib/utils";
import { FindingNumber } from "./FindingNumber";

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
  warn: "border-warning-mark bg-warning-mark/10",
  pass: "border-passed",
} as const;

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

/** The poster with a numbered box over each problem. Click a box to open its finding; the
 * other boxes step back so the chosen one stands out. */
export function PosterCanvas({ imageUrl, title, problems, selected, onSelect }: PosterCanvasProps) {
  return (
    <figure className="relative overflow-hidden rounded-md border border-line bg-surface-sunken">
      {imageUrl ? (
        <img src={imageUrl} alt={`Poster: ${title}`} fetchPriority="high" className="block w-full" />
      ) : (
        <div className="grid aspect-4/5 place-items-center p-6 text-center text-sm text-muted-text">
          The image couldn't be loaded. Reload the page to try again.
        </div>
      )}
      {groupByBox(problems).map(({ box, items }) => {
        const [ymin, xmin, ymax, xmax] = box;
        const at = items.findIndex((p) => p.number === selected);
        const top = items[0].finding; // most serious first
        const settled = items.every((p) => p.finding.status !== "open");
        // Clicking a shared box steps through its findings, then lets go.
        const next = at === -1 ? items[0].number : (items[at + 1]?.number ?? null);
        return (
          <button
            key={box.join(",")}
            type="button"
            onClick={() => onSelect(next)}
            aria-label={items.map((p) => `Finding ${p.number}: ${p.finding.message}`).join(" ")}
            aria-pressed={at !== -1}
            className={cn(
              "absolute rounded-xs border-2",
              BOX_TONE[top.severity],
              settled && "border-dashed",
              selected !== null && at === -1 && "opacity-35",
              at !== -1 && "z-10 outline-2 outline-offset-2 outline-accent",
            )}
            style={{
              top: `calc(${ymin / 10}% - 4px)`,
              left: `calc(${xmin / 10}% - 4px)`,
              width: `calc(${(xmax - xmin) / 10}% + 8px)`,
              height: `calc(${(ymax - ymin) / 10}% + 8px)`,
            }}
          >
            <span className={cn("absolute -left-0.5 flex gap-0.5", ymin < 60 ? "top-full mt-1" : "bottom-full mb-1")}>
              {items.map((p) => (
                <FindingNumber key={p.number} number={p.number} severity={p.finding.severity} muted={p.finding.status !== "open"} />
              ))}
            </span>
          </button>
        );
      })}
    </figure>
  );
}
