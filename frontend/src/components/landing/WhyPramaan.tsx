import type { ReactNode } from "react";
import { ConsentVisual } from "./visuals/ConsentVisual";
import { ReadersVisual } from "./visuals/ReadersVisual";
import { RulebookVisual } from "./visuals/RulebookVisual";

const REASONS: { title: string; text: string; visual: ReactNode }[] = [
  {
    title: "Make your own brand rulebook",
    text: "Tell Pramaan what your organisation does and it sets up the rulebooks that fit: a coaching institute gets courses, fees and a toppers register; a restaurant gets its menu and prices. Add or remove rulebooks whenever you like.",
    visual: <RulebookVisual />,
  },
  {
    title: "Consent before publicity",
    text: "Nobody appears on a poster without signed consent that covers the channel, is still in date, and comes from a guardian for minors. Consent files stay private to head office and are never sent to the AI.",
    visual: <ConsentVisual />,
  },
  {
    title: "Two readers for every number",
    text: "Prices, ranks and phone numbers are read by Gemini and again by Tesseract. When the two disagree, Pramaan asks a person instead of guessing. Every decision and every AI call goes in the audit log.",
    visual: <ReadersVisual />,
  },
];

/** Three reasons, each beside a still of the part of Pramaan that delivers it. */
export function WhyPramaan() {
  return (
    <section id="why" className="scroll-mt-20 border-x border-b border-line px-5 py-20 sm:px-8">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Why Pramaan?</h2>
      <div className="mt-12 flex flex-col divide-y divide-line border-y border-line">
        {REASONS.map((r) => (
          <div key={r.title} className="grid items-center gap-8 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">{r.title}</h3>
              <p className="max-w-md text-pretty text-muted-text">{r.text}</p>
            </div>
            <div className="w-full max-w-md md:justify-self-end">{r.visual}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
