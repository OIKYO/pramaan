import { ToneBadge } from "@/components/ui/ToneBadge";

export function Branches() {
  return (
    <section id="branches" className="grid scroll-mt-20 gap-10 border-b border-line px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-16 lg:px-12">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">One organisation, many branches</h2>
        <p className="max-w-sm text-pretty text-muted-text">
          Each branch can make its own posters without losing sight of the rules set by head office. Reviews follow a
          clear path from the branch to the region and finally to head office.
        </p>
      </div>
      <div className="grid gap-10 md:grid-cols-2 md:gap-8">
        <div className="flex flex-col gap-4">
          <div aria-hidden className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3">
            <span className="size-2 rounded-full bg-blocked" />
            <span className="font-medium text-ink-strong">Admissions open 2027</span>
            <span className="text-muted-text">Siliguri · Print · version 2</span>
            <span className="ml-auto"><ToneBadge tone="blocked">1 problem to fix</ToneBadge></span>
          </div>
          <p className="text-pretty text-muted-text">
            <span className="font-medium text-ink-strong">Branch staff</span> make and upload posters for their branch. They see
            the problems Pramaan finds, read the exact fixes, and upload a corrected version. They can compare poster versions
            before sending them for review.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div aria-hidden className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-medium text-ink-strong">East region</span>
            <span className="text-muted-text">3 posters waiting</span>
            <span className="ml-auto flex gap-2">
              <span className="rounded-md border border-line-strong px-3 py-1 text-xs font-medium text-ink-strong">Send back</span>
              <span className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-on-primary">Approve</span>
            </span>
          </div>
          <p className="text-pretty text-muted-text">
            <span className="font-medium text-ink-strong">Regional managers</span> review posters submitted by their branches and
            approve them or send them back with a comment. <span className="font-medium text-ink-strong">Head office</span> manages
            the rulebooks, branches and people, then gives final approval. Every decision is recorded.
          </p>
        </div>
      </div>
    </section>
  );
}
