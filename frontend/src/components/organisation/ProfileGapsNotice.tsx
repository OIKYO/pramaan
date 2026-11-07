/** Stays at the top of the profile until head office has said what the organisation does. */
export function ProfileGapsNotice({ gaps }: { gaps: string[] }) {
  if (gaps.length === 0) return null;
  return (
    <div role="status" className="flex items-start gap-3 rounded-lg border border-control-on/60 bg-accent-soft px-4 py-3">
      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-control-on" />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-ink-strong">Finish your organisation's details</p>
        <p className="text-ink">
          Add its {gaps.join(" and ")}. Pramaan uses them to pick the words your team sees and the rulebooks it suggests.
          This marker stays in the menu until they're filled in.
        </p>
      </div>
    </div>
  );
}
