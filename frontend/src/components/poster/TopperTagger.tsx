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
  if (toppers.isPending) return <Skeleton className="h-24 w-full" />;
  if (toppers.isError) return <p className="text-sm text-blocked">{toppers.error.message}</p>;

  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">Students shown on the poster</legend>
      {toppers.data.map((t) => (
        <label key={t.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm">
          <Checkbox checked={value.includes(t.id)} onCheckedChange={(on) => toggle(t.id, on === true)} />
          <span className="flex-1">
            {t.full_name} <span className="text-muted-text">· AIR {t.rank}</span>
          </span>
          {!t.has_consent && <ToneBadge tone="blocked">No consent on file</ToneBadge>}
        </label>
      ))}
    </fieldset>
  );
}
