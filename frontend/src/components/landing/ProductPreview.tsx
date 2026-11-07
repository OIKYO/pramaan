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

/** A still of the poster page: a real (fictional) test poster, its problems boxed on it, and the
 * findings beside it with their fixes. */
export function ProductPreview() {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-surface shadow-overlay" aria-label="Pramaan showing the problems on a poster">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-sm font-medium text-ink-strong">JEE Main 2026 toppers</span>
          <span className="hidden text-xs text-muted-text sm:inline">Siliguri branch · Instagram · version 1</span>
        </div>
        <ToneBadge tone="blocked" dot>Can't be approved yet</ToneBadge>
      </div>
      <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="border-b border-line bg-canvas p-4 sm:p-6 md:border-r md:border-b-0">
          <div className="relative mx-auto max-w-sm overflow-hidden rounded-md border border-line">
            <img src="/demo/poster-wrong-rank.webp" alt="" width={720} height={900} className="block w-full" />
            <span className="absolute rounded-xs border-2 border-blocked bg-blocked/10" style={box(RANK_BOX)}>
              <span className="absolute bottom-full -left-0.5 mb-1"><FindingNumber number={1} severity="block" /></span>
            </span>
            <span className="absolute rounded-xs border-2 border-info bg-info/10" style={box(PHONE_BOX)}>
              <span className="absolute bottom-full -left-0.5 mb-1"><FindingNumber number={2} severity="needs_human" /></span>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 text-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium whitespace-nowrap text-ink-strong">2 problems</span>
            <span className="hidden text-right text-xs text-muted-text sm:inline">Read by Gemini, numbers read again by Tesseract</span>
          </div>
          <article className="flex flex-col gap-1.5 rounded-lg border border-ink-strong/20 bg-surface p-4">
            <header className="flex items-center gap-2">
              <FindingNumber number={1} severity="block" />
              <span className="text-xs text-muted-text">CCPA-04 · Rank matches the register</span>
            </header>
            <p className="font-medium text-ink-strong">Shows AIR 37 for Riya Sen; the register says AIR 73.</p>
            <p className="text-ink"><span className="font-medium text-ink-strong">Fix</span> Change the rank to AIR 73.</p>
          </article>
          <article className="flex flex-col gap-1.5 rounded-lg border border-line p-4">
            <header className="flex items-center gap-2">
              <FindingNumber number={2} severity="needs_human" />
              <span className="text-xs text-muted-text">READ-02 · Key numbers read twice</span>
            </header>
            <p className="font-medium text-ink-strong">The two readers disagree about this phone number.</p>
            <p className="text-muted-text">A reviewer confirms the right number before anyone can approve.</p>
          </article>
          <article className="flex items-center gap-3 rounded-lg border border-line p-4">
            <ToneBadge tone="passed">15 passed</ToneBadge>
            <p className="text-muted-text">Consent, fees, course details, logo, colours, contrast, alt text…</p>
          </article>
          <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
            <span className="mr-auto text-xs text-muted-text">Nothing is published until head office approves.</span>
            <span className="shrink-0 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-strong">Send back</span>
            <span className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary opacity-50">Approve</span>
          </div>
        </div>
      </div>
    </figure>
  );
}
