/** A colour chip with its hex value. The colour is data (from the brand kit), so it's set inline. */
export function Swatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className="size-6 rounded-sm border border-line-strong" style={{ background: color }} />
      <code className="font-mono text-xs text-ink">{color}</code>
    </span>
  );
}
