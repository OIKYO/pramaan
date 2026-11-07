import { useState } from "react";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { PreviewFindings } from "./preview/PreviewFindings";
import { PreviewPoster } from "./preview/PreviewPoster";

const NOTES = {
  idle: "This is an example with a fictional poster. Click a problem, or its box on the poster.",
  approve: "Approve stays locked until the rank is fixed and a reviewer confirms the phone number.",
  sendBack: "In Pramaan this goes back to the Siliguri branch with both findings. This example sends nothing.",
};

/** An example of the poster page, marked as one: a fictional test poster with its problems boxed, the
 * findings beside it, and the reviewer's buttons. It works, but nothing here touches a server. */
export function ProductPreview() {
  const [selected, setSelected] = useState<number | null>(1);
  const [note, setNote] = useState<keyof typeof NOTES>("idle");
  return (
    <figure className="flex flex-col gap-3" aria-label="An example of Pramaan's poster page, with a fictional poster">
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-overlay">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <ToneBadge tone="accent">Example</ToneBadge>
            <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-sm font-medium text-ink-strong">JEE Main 2026 toppers</span>
            <span className="hidden text-xs text-muted-text sm:inline">Siliguri branch · Instagram · version 1</span>
          </div>
          <ToneBadge tone="blocked" dot>Can't be approved yet</ToneBadge>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="border-b border-line bg-canvas p-4 sm:p-8 lg:border-r lg:border-b-0">
            <PreviewPoster selected={selected} onSelect={setSelected} />
          </div>
          <div className="flex flex-col gap-4 p-4 text-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium whitespace-nowrap text-ink-strong">2 problems</span>
              <span className="hidden text-right text-xs text-muted-text sm:inline">Read by Gemini, numbers read again by Tesseract</span>
            </div>
            <PreviewFindings selected={selected} onSelect={setSelected} />
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <p aria-live="polite" className="min-w-48 flex-1 text-xs text-muted-text">{NOTES[note]}</p>
              <button
                type="button"
                onClick={() => setNote("sendBack")}
                className="cursor-pointer rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-strong hover:bg-surface-sunken"
              >
                Send back
              </button>
              <button
                type="button"
                aria-disabled
                onClick={() => setNote("approve")}
                className="cursor-not-allowed rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="text-center text-xs text-muted-text">
        Example only. Northfield Academy and everyone on this poster are made up, and nothing you click here is saved.
      </figcaption>
    </figure>
  );
}
