import { BadgeCheck, Crosshair, ListChecks, ScanText } from "lucide-react";

const FEATURES = [
  { icon: ScanText, title: "Reads every poster", text: "Gemini reads the poster's text, prices, numbers, people and claims, including content in Hindi and Bengali." },
  { icon: ListChecks, title: "Checks in code", text: "Plain code applies up to 27 checks against the organisation's approved rulebooks. AI wording checks can warn, but never block." },
  { icon: Crosshair, title: "Marks the problem", text: "Every finding identifies the location, broken rule, reason and exact fix. Passed checks are listed too." },
  { icon: BadgeCheck, title: "People approve", text: "Branches fix and resubmit. Regional managers review, then head office gives final approval." },
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
