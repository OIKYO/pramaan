import { useId } from "react";
import { useToppers } from "@/api/hooks/useRulebook";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ToneBadge } from "@/components/ui/ToneBadge";

interface TopperTaggerProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

/** Staff tag the students shown on the poster. Pramaan doesn't recognise faces. */
export function TopperTagger({ value, onChange }: TopperTaggerProps) {
  const toppers = useToppers();
  const prefix = useId();
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="pb-1.5 text-sm font-semibold text-ink-strong">Students shown on the poster</legend>
      <p className="pb-1 text-sm text-muted-text">Tick everyone pictured or named. Pramaan matches names, not faces.</p>
      {toppers.isPending ? (
        <Skeleton className="h-28 w-full" />
      ) : toppers.isError ? (
        <p className="text-sm text-blocked">{toppers.error.message}</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {toppers.data.map((t) => {
            const id = `${prefix}-${t.id}`;
            return (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 text-sm has-checked:bg-surface-sunken/60">
                <Checkbox id={id} checked={value.includes(t.id)} onCheckedChange={(on) => toggle(t.id, on === true)} />
                <label htmlFor={id} className="flex flex-1 cursor-pointer flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-ink-strong">{t.full_name}</span>
                  <span className="text-muted-text tabular-nums">AIR {t.rank}</span>
                </label>
                {!t.has_consent && <ToneBadge tone="blocked">No consent on file</ToneBadge>}
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
