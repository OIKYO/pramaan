/**
 * A drawing of what Pramaan does: a poster with three checked spots (a blocked rank, a fee that
 * needs a person, a disclaimer that passed). Vector and token-coloured, so it follows the theme.
 * Use it on a midnight surface (data-theme="dark"), such as the sign-in brand panel.
 */
/** A finding number on the drawing. */
function marker(x: number, y: number, label: string, tone: "blocked" | "info" | "passed") {
  const fill = { blocked: "fill-blocked", info: "fill-info", passed: "fill-passed" }[tone];
  return (
    <g>
      <rect x={x} y={y} width="18" height="18" rx="2" className={fill} />
      <text x={x + 9} y={y + 13} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-on-tone font-sans">
        {label}
      </text>
    </g>
  );
}

export function PosterIllustration() {
  return (
    <svg viewBox="0 0 320 380" role="img" aria-label="A poster with three marked spots: one blocked, one for a person to check, one passed" className="h-auto w-full">
      <rect x="40" y="16" width="240" height="340" rx="4" className="fill-surface stroke-line-strong" strokeWidth="1.5" />
      <rect x="64" y="42" width="128" height="14" rx="2" className="fill-ink-strong" />
      <rect x="64" y="64" width="176" height="7" rx="2" className="fill-muted-text" />
      <rect x="64" y="96" width="78" height="96" rx="3" className="fill-surface-sunken" />
      <circle cx="103" cy="132" r="16" className="fill-line-strong" />
      <rect x="83" y="154" width="40" height="26" rx="13" className="fill-line-strong" />
      <rect x="156" y="104" width="92" height="10" rx="2" className="fill-ink" />
      <rect x="156" y="122" width="56" height="12" rx="2" className="fill-ink-strong" />
      <rect x="156" y="142" width="80" height="6" rx="2" className="fill-muted-text" />
      <rect x="156" y="156" width="64" height="6" rx="2" className="fill-muted-text" />
      <rect x="64" y="220" width="120" height="10" rx="2" className="fill-ink" />
      <rect x="64" y="238" width="88" height="14" rx="2" className="fill-ink-strong" />
      <rect x="64" y="284" width="192" height="5" rx="2" className="fill-muted-text" />
      <rect x="64" y="295" width="160" height="5" rx="2" className="fill-muted-text" />
      <rect x="64" y="322" width="96" height="10" rx="2" className="fill-action" />

      <rect x="150" y="117" width="68" height="22" rx="2" fill="none" className="stroke-blocked" strokeWidth="2" />
      {marker(141, 108, "1", "blocked")}
      <rect x="58" y="232" width="100" height="26" rx="2" fill="none" className="stroke-info" strokeWidth="2" />
      {marker(49, 223, "2", "info")}
      <rect x="58" y="278" width="204" height="28" rx="2" fill="none" className="stroke-passed" strokeWidth="2" strokeDasharray="5 4" />
      {marker(253, 269, "✓", "passed")}
    </svg>
  );
}
