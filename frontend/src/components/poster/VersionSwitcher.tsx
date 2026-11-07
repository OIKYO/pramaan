import type { Version } from "@/api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/labels";

/** Pick which version's findings to show. Hidden when there is only one version. */
export function VersionSwitcher({ versions, value, current, onChange }: {
  versions: Version[];
  value: number;
  current: number;
  onChange: (version: number) => void;
}) {
  if (versions.length < 2) return null;
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full sm:w-80" aria-label="Show version">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[...versions].reverse().map((v) => (
          <SelectItem key={v.id} value={String(v.version)}>
            Version {v.version}
            {v.version === current ? " (current)" : ""} · {formatDateTime(v.created_at)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
