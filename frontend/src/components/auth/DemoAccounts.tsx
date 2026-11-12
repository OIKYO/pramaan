import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { DEMO_ACCOUNTS } from "@/lib/demo";

export function DemoAccounts({ pending, onPick }: { pending: string | null; onPick: (email: string) => void }) {
  return (
    <section id="demo" className="flex scroll-mt-6 flex-col gap-3" aria-labelledby="demo-heading">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <h2 id="demo-heading" className="text-xs font-medium text-muted-text">Or try the demo</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-col gap-0.5 border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink-strong">Northfield Academy</p>
          <p className="text-xs text-pretty text-muted-text">A made-up coaching chain, run by team <span className="whitespace-nowrap">HEISEN-DE-BUG</span>. Pick who to be.</p>
        </div>
        <ul className="flex flex-col divide-y divide-line">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => onPick(account.email)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken focus-visible:bg-surface-sunken disabled:opacity-60"
              >
                <Avatar name={account.name} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-ink-strong">{account.name}</span>
                  <span className="truncate text-xs text-muted-text">{account.role} · {account.where}</span>
                </span>
                {pending === account.email ? <Spinner /> : <ArrowRight className="size-4 shrink-0 text-muted-text" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-pretty text-muted-text">
        The people are our team. The institute, its students (Riya Sen and friends), courses and numbers are made up, and a
        few settings are switched off so the demo stays the same for everyone.
      </p>
    </section>
  );
}
