import { BadgeCheck, Crosshair, ListChecks, ScanText } from "lucide-react";

const FEATURES = [
  { icon: ScanText, title: "Reads every poster", text: "Gemini reads the words, prices, phone numbers and people. Tesseract reads the key numbers a second time." },
  { icon: ListChecks, title: "Checks it in code", text: "Up to 17 checks against your brand kit, prices, approved figures and consent records. Same poster, same result." },
  { icon: Crosshair, title: "Marks the fix", text: "Each problem is boxed on the poster with the rule it breaks and the exact change to make." },
  { icon: BadgeCheck, title: "People approve", text: "A regional manager reviews, then head office approves. The AI can flag wording; it never approves." },
];

/** What happens to a poster, in four cells. The 1px gaps over the line colour draw the grid. */
export function FeatureStrip() {
  return (
    <section aria-label="What Pramaan does" className="grid gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex flex-col gap-3 bg-canvas px-5 py-8 sm:px-8 lg:px-12">
          <Icon className="size-5 text-ink-strong" aria-hidden />
          <h3 className="text-sm">{title}</h3>
          <p className="text-pretty text-muted-text">{text}</p>
        </div>
      ))}
    </section>
  );
}
