import { FindingNumber } from "@/components/poster/FindingNumber";
import { ToneBadge } from "@/components/ui/ToneBadge";

/** Boxes from the fixture reading of test-posters/03-wrong-rank.png, as [top, left, height, width] in %. */
const RANK_BOX = { top: 32.9, left: 30.4, height: 1.7, width: 3.1 };
const PHONE_BOX = { top: 53.6, left: 28.6, height: 1.7, width: 23.8 };

const box = (b: typeof RANK_BOX) => ({
  top: `calc(${b.top}% - 4px)`,
  left: `calc(${b.left}% - 4px)`,
  width: `calc(${b.width}% + 8px)`,
  height: `calc(${b.height}% + 8px)`,
});

/** A still of the poster page: a real (fictional) test poster with its findings beside it. */
export function ProductPreview() {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-surface shadow-overlay" aria-label="Pramaan showing two problems on a poster">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-ink-strong">JEE Main 2026 toppers</span>
          <span className="text-xs text-muted-text">Siliguri branch · Instagram · version 1</span>
        </div>
        <ToneBadge tone="blocked" dot>
          Can't be approved yet
        </ToneBadge>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="relative overflow-hidden rounded-md border border-line">
          <img src="/demo/poster-wrong-rank.webp" alt="" width={720} height={900} className="block w-full" />
          <span className="absolute rounded-xs border-2 border-blocked bg-blocked/10" style={box(RANK_BOX)}>
            <span className="absolute bottom-full -left-0.5 mb-1">
              <FindingNumber number={1} severity="block" />
            </span>
          </span>
          <span className="absolute rounded-xs border-2 border-info bg-info/10" style={box(PHONE_BOX)}>
            <span className="absolute bottom-full -left-0.5 mb-1">
              <FindingNumber number={2} severity="needs_human" />
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex flex-col gap-1.5 rounded-md border border-accent p-3 ring-1 ring-accent">
            <div className="flex items-center gap-2">
              <FindingNumber number={1} severity="block" />
              <span className="font-mono text-xs text-muted-text">CCPA-04</span>
            </div>
            <p className="font-medium text-ink-strong">Shows AIR 37 for Riya Sen; the register says AIR 73.</p>
            <p className="text-ink">
              <span className="font-medium text-ink-strong">Fix</span> Change the rank to AIR 73.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-md border border-line p-3">
            <div className="flex items-center gap-2">
              <FindingNumber number={2} severity="needs_human" />
              <span className="font-mono text-xs text-muted-text">READ-02</span>
            </div>
            <p className="font-medium text-ink-strong">The two readers disagree about this phone number.</p>
            <p className="text-muted-text">A reviewer confirms it before approval.</p>
          </div>
          <p className="px-1 text-xs text-muted-text">16 more checks passed: consent, fees, logo, colours, contrast…</p>
        </div>
      </div>
    </figure>
  );
}
