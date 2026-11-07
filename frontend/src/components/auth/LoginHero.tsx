import { BrandLogo } from "@/components/ui/BrandLogo";
import { PosterIllustration } from "@/components/ui/PosterIllustration";

const STEPS = [
  { title: "The AI reads", text: "Every word, name and number on the poster, and where it sits." },
  { title: "Code decides", text: "17 checks against the rulebook and the CCPA coaching guidelines, the same way every time." },
  { title: "People approve", text: "A regional manager, then head office. The AI never approves anything." },
];

/** The brand panel: always midnight (it sets its own theme), whatever the rest of the page uses. */
export function LoginHero() {
  return (
    <section data-theme="dark" className="flex flex-col gap-10 bg-surface-sunken px-6 py-8 text-ink sm:px-10 lg:px-14 lg:py-12">
      <BrandLogo className="w-48 text-ink-strong" />
      <div className="flex flex-col gap-3">
        <h1 className="max-w-md text-4xl leading-tight sm:text-5xl">Every branch poster, checked before it's published.</h1>
        <p className="max-w-md text-pretty text-muted-text">
          Pramaan checks posters from every branch against head office's brand kit, approved facts and a consent-backed toppers
          register, and shows each problem on the poster with the fix.
        </p>
      </div>
      <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
              <span className="font-mono text-sm text-action tabular-nums">0{i + 1}</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink-strong">{step.title}</span>
                <span className="text-sm text-pretty text-muted-text">{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mx-auto hidden w-full max-w-xs sm:block">
          <PosterIllustration />
        </div>
      </div>
    </section>
  );
}
