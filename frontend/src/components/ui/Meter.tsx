export function Meter({ value, label }: { value: number; label: string }) {
  const share = Math.min(Math.max(value, 0), 1);
  return (
    <span role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}
      className="block h-2 w-full overflow-hidden rounded-full bg-primary/15">
      <span className="block h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
    </span>
  );
}
