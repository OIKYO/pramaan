const BOOKS = [
  { name: "Brand kit", note: "Always on", on: true },
  { name: "Courses and fees", note: "4 checks", on: true },
  { name: "Toppers register", note: "2 checks", on: true },
  { name: "Exam results (coaching ads)", note: "CCPA 2024", on: true },
  { name: "Impact figures", note: "For NGOs", on: false },
];

/** A still of the Rulebooks page for a coaching institute: what's on, and one that isn't. */
export function RulebookVisual() {
  return (
    <div aria-hidden className="flex flex-col rounded-lg border border-line bg-surface">
      <p className="border-b border-line px-4 py-2.5 text-xs text-muted-text">Rulebooks · Coaching Institutes</p>
      <ul className="flex flex-col divide-y divide-line">
        {BOOKS.map((b) => (
          <li key={b.name} className="flex items-center gap-3 px-4 py-2.5">
            <span className={b.on ? "flex-1 text-sm text-ink-strong" : "flex-1 text-sm text-muted-text"}>{b.name}</span>
            <span className="text-xs text-muted-text">{b.note}</span>
            <span className={b.on ? "flex h-4 w-7 justify-end rounded-full bg-primary p-0.5" : "flex h-4 w-7 rounded-full bg-line-strong p-0.5"}>
              <span className="size-3 rounded-full bg-surface" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
