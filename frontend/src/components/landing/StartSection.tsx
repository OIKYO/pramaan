import { FileUp, UsersRound } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

const SWATCHES = ["bg-ink-strong", "bg-accent", "bg-passed", "bg-surface-sunken"];

/** Signing up, and the three things a new organisation sets up first. */
export function StartSection() {
  return (
    <section id="start" className="grid scroll-mt-20 items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-12">
      <div className="flex flex-col items-start gap-4">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start with Pramaan</h2>
        <p className="max-w-md text-pretty text-muted-text">
          Pramaan is free during the pilot. Create your organisation, set up its rulebooks and branches, add your team, and
          start checking posters before they go out.
        </p>
        <Button size="lg" asChild className="mt-2">
          <Link to="/signup">Create organisation</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-4 border-b border-line p-6">
          <h3 className="text-lg font-semibold">Brand kit</h3>
          <p className="text-muted-text">Add your registered name, logo, colours, helpline and tone of voice. Pramaan checks posters against the brand records approved by head office.</p>
          <div aria-hidden className="flex gap-2">
            {SWATCHES.map((s) => <span key={s} className={`size-7 rounded-md border border-line ${s}`} />)}
          </div>
        </div>
        <div className="grid gap-px bg-line sm:grid-cols-2">
          <div className="flex flex-col gap-2 bg-surface p-6">
            <FileUp className="size-5 text-ink-strong" aria-hidden />
            <h3 className="text-sm">Import your data securely</h3>
            <p className="text-muted-text">Import branches, offerings, figures, people and team members from CSV files. Every row is checked first; nothing is saved until the whole file is right.</p>
          </div>
          <div className="flex flex-col gap-2 bg-surface p-6">
            <UsersRound className="size-5 text-ink-strong" aria-hidden />
            <h3 className="text-sm">Add your team your way</h3>
            <p className="text-muted-text">Invite people with one-use links that expire after seven days, share your organisation's join code, or add team members with temporary passwords they must change at first sign-in.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
