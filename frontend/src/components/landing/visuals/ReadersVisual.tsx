/** A still of the second read: the same number read by two readers, and what happens when they differ. */
export function ReadersVisual() {
  const rows = [
    { what: "Fee", first: "₹48,000", second: "₹48,000", same: true },
    { what: "Rank", first: "AIR 73", second: "AIR 73", same: true },
    { what: "Phone", first: "+91 10000 22102", second: "+91 10000 22702", same: false },
  ];
  return (
    <div aria-hidden className="overflow-hidden rounded-lg border border-line bg-surface text-xs">
      <div className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] border-b border-line px-4 py-2.5 text-muted-text">
        <span />
        <span>Gemini</span>
        <span>Tesseract</span>
      </div>
      {rows.map((r) => (
        <div key={r.what} className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] items-center border-b border-line px-4 py-2.5 last:border-b-0">
          <span className="text-muted-text">{r.what}</span>
          <span className="truncate text-ink-strong tabular-nums">{r.first}</span>
          <span className={r.same ? "truncate text-ink-strong tabular-nums" : "truncate font-medium text-blocked tabular-nums"}>{r.second}</span>
        </div>
      ))}
      <p className="bg-surface-sunken px-4 py-2.5 text-muted-text">The readers disagree on the phone number, so a reviewer confirms it.</p>
    </div>
  );
}
