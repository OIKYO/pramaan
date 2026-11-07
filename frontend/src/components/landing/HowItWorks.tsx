import { BadgeCheck, ImageUp, ListChecks, ScanText } from "lucide-react";

const STEPS = [
  { icon: ImageUp, title: "A branch uploads", text: "The final artwork, its caption, and the students it shows." },
  { icon: ScanText, title: "AI reads it", text: "Every word, name and number, with where it sits. A second reader re-checks the numbers." },
  { icon: ListChecks, title: "Code decides", text: "17 checks against your rulebook and the CCPA coaching guidelines, the same way every time." },
  { icon: BadgeCheck, title: "People approve", text: "A regional manager, then head office. Every decision and override is on record." },
];

/** The flow from upload to approval. */
export function HowItWorks() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col gap-2 bg-surface px-5 py-8 sm:px-8">
            <Icon className="size-5 text-ink-strong" aria-hidden />
            <h2 className="text-sm">{title}</h2>
            <p className="text-sm text-pretty text-muted-text">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
