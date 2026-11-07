/** A colour chip with its hex value. The colour is data (from the brand kit), so it's set inline. */
export function Swatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className="size-5 rounded border border-line" style={{ background: color }} />
      <code className="text-xs text-muted-text">{color}</code>
    </span>
  );
}
