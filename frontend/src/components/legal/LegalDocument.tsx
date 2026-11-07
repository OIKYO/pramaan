import { Link } from "react-router";
import type { LegalDoc } from "./legalText";

/** One legal page: a title, when it last changed, and short sections, between the page rails. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="flex flex-1 flex-col border-x border-line px-5 py-16 sm:px-16">
      <div className="flex max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <Link to="/" className="text-sm text-muted-text hover:text-ink-strong">Pramaan</Link>
          <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="text-muted-text">Last changed {doc.updated}</p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            {s.body.map((p) => <p key={p.slice(0, 40)} className="text-base leading-relaxed text-pretty text-ink">{p}</p>)}
          </section>
        ))}
      </div>
    </article>
  );
}
