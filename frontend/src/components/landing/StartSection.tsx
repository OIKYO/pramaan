import { FileUp, UsersRound } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

const SWATCHES = ["bg-ink-strong", "bg-accent", "bg-passed", "bg-surface-sunken"];

/** Signing up, and the three things a new organisation sets up first. */
export function StartSection() {
  return (
    <section id="start" className="grid scroll-mt-20 items-center gap-12 border-x border-b border-line px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col items-start gap-4">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start for free</h2>
        <p className="max-w-md text-pretty text-muted-text">
          Create your organisation, say what it does, and Pramaan sets up the rulebooks to match. It's free while Pramaan is
          in its pilot. Your organisation's data is visible only to your organisation.
        </p>
        <Button size="lg" asChild className="mt-2">
          <Link to="/signup">Create organisation</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-4 border-b border-line p-6">
          <h3 className="text-lg font-semibold">Brand kit</h3>
          <p className="text-muted-text">Your registered name, helpline, logo, colours and tone of voice. Every poster is checked against them.</p>
          <div aria-hidden className="flex gap-2">
            {SWATCHES.map((s) => <span key={s} className={`size-7 rounded-md border border-line ${s}`} />)}
          </div>
        </div>
        <div className="grid gap-px bg-line sm:grid-cols-2">
          <div className="flex flex-col gap-2 bg-surface p-6">
            <FileUp className="size-5 text-ink-strong" aria-hidden />
            <h3 className="text-sm">Import your data securely</h3>
            <p className="text-muted-text">Branches, prices, figures and people from the spreadsheets you keep, checked line by line before anything is saved.</p>
          </div>
          <div className="flex flex-col gap-2 bg-surface p-6">
            <UsersRound className="size-5 text-ink-strong" aria-hidden />
            <h3 className="text-sm">Add your team your way</h3>
            <p className="text-muted-text">Branch staff, regional managers and head office, each with their own sign-in and only the access their role needs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
