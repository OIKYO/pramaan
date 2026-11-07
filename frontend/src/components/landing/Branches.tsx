import { ToneBadge } from "@/components/ui/ToneBadge";

/** Each role in one line of the real queues: a branch's poster, then a region's review. */
export function Branches() {
  return (
    <section id="branches" className="scroll-mt-20 border-x border-b border-line px-5 py-20 sm:px-8">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built for many branches</h2>
        <p className="text-pretty text-muted-text">
          A chain with forty branches makes hundreds of posters a month. Pramaan gives each branch its own space, sends their
          posters up a two-step review, and keeps one rulebook for everyone.
        </p>
      </div>
      <div className="mt-12 flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div aria-hidden className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3">
            <span className="size-2 rounded-full bg-blocked" />
            <span className="font-medium text-ink-strong">Admissions open 2027</span>
            <span className="text-muted-text">Siliguri · Print · version 2</span>
            <span className="ml-auto"><ToneBadge tone="blocked">1 problem to fix</ToneBadge></span>
          </div>
          <p className="max-w-2xl text-pretty text-muted-text">
            <span className="font-medium text-ink-strong">Branch staff</span> upload a poster, see what's wrong within a minute,
            and upload a fixed version. Each branch sees only its own posters.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div aria-hidden className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-medium text-ink-strong">East region</span>
            <span className="text-muted-text">3 posters waiting for review</span>
            <span className="ml-auto flex gap-2">
              <span className="rounded-md border border-line-strong px-3 py-1 text-xs font-medium text-ink-strong">Send back</span>
              <span className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-on-primary">Approve</span>
            </span>
          </div>
          <p className="max-w-2xl text-pretty text-muted-text">
            <span className="font-medium text-ink-strong">Regional managers</span> review their branches' posters.{" "}
            <span className="font-medium text-ink-strong">Head office</span> gives the final approval, and can override a block
            only with a written reason. Nobody can approve a poster they made.
          </p>
        </div>
      </div>
    </section>
  );
}
