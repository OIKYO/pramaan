import { FileSpreadsheet, KeyRound, Palette } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

const STEPS = [
  { icon: Palette, title: "Set your brand kit", text: "Registered name, helpline, logo, colours, tone and banned phrases." },
  { icon: FileSpreadsheet, title: "Import your records", text: "Branches, courses and fees, results figures and toppers, from CSV. Every row is checked before anything is saved." },
  { icon: KeyRound, title: "Add your team", text: "Each person gets a role and a temporary password, and picks their own at first sign-in." },
];

/** How a new company gets going. */
export function SetupSection() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:py-20">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl">Set up in an afternoon</h2>
          <p className="text-pretty text-muted-text">
            Create your organisation and you're its head office. Bring the records you already keep in spreadsheets; Pramaan
            checks posters against them from the first upload.
          </p>
          <div>
            <Button asChild>
              <Link to="/signup">Create your organisation</Link>
            </Button>
          </div>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2 bg-surface p-5">
              <Icon className="size-5 text-ink-strong" aria-hidden />
              <h3 className="text-sm">{title}</h3>
              <p className="text-sm text-pretty text-muted-text">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
