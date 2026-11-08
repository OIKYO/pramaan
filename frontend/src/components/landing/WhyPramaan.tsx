import type { ReactNode } from "react";
import { ConsentVisual } from "./visuals/ConsentVisual";
import { ReadersVisual } from "./visuals/ReadersVisual";
import { RulebookVisual } from "./visuals/RulebookVisual";

const REASONS: { title: string; text: string; visual: ReactNode }[] = [
  {
    title: "Rules for your organisation",
    text: "Head office sets the approved records and chooses the rulebooks. Their names adapt to your industry, from Courses and fees to Menu and prices.",
    visual: <RulebookVisual />,
  },
  {
    title: "Consent before publicity",
    text: "Everyone shown must be in the organisation's people register with valid, signed consent covering the publication channel. Staff identify people by tagging them; Pramaan does not recognise faces.",
    visual: <ConsentVisual />,
  },
  {
    title: "Two readers for key numbers",
    text: "Gemini reads the poster, while Tesseract independently reads prices, ranks, phone numbers and figures. If they disagree, a person confirms the number instead of Pramaan guessing.",
    visual: <ReadersVisual />,
  },
];

/** The heading stays in view on the left while the three reasons, each beside a still of the part
 * of Pramaan that delivers it, scroll past on the right. */
export function WhyPramaan() {
  return (
    <section id="why" className="grid scroll-mt-20 gap-10 border-b border-line px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-16 lg:px-12">
      <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Why Pramaan?</h2>
        <p className="max-w-sm text-pretty text-muted-text">Keep the posters made by different branches consistent with the rules head office has approved.</p>
      </div>
      <div className="flex flex-col divide-y divide-line border-y border-line">
        {REASONS.map((r) => (
          <div key={r.title} className="grid items-center gap-8 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">{r.title}</h3>
              <p className="text-pretty text-muted-text">{r.text}</p>
            </div>
            {r.visual}
          </div>
        ))}
      </div>
    </section>
  );
}
