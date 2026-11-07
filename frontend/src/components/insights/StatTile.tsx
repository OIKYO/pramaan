/** One headline number with its label. */
export function StatTile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-line bg-surface p-4">
      <span className="text-sm text-muted-text">{label}</span>
      <span className="font-heading text-4xl font-semibold text-ink-strong tabular-nums">{value}</span>
      {note && <span className="text-xs text-muted-text">{note}</span>}
    </div>
  );
}
