import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { DEMO_ACCOUNTS } from "@/lib/demo";

/** One-click sign-in to the fictional demo organisation, one account per role. */
export function DemoAccounts({ pending, onPick }: { pending: string | null; onPick: (email: string) => void }) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="demo-heading">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <h2 id="demo-heading" className="text-xs font-medium text-muted-text">
          Or explore the demo organisation
        </h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => onPick(account.email)}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-surface-sunken disabled:opacity-60"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-ink-strong">{account.role}</span>
                <span className="truncate text-xs text-muted-text">{account.who}</span>
              </span>
              {pending === account.email ? <Spinner /> : <ArrowRight className="size-4 text-muted-text" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-text">Northfield Academy is fictional, and so is everyone in it.</p>
    </section>
  );
}
