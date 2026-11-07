import type { Version } from "@/api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/labels";

interface VersionSwitcherProps {
  versions: Version[];
  value: number;
  onChange: (version: number) => void;
  /** The poster's current version, marked in the list. */
  current?: number;
  label?: string;
}

/** Pick a version of the poster, newest first. Hidden when there is only one version. */
export function VersionSwitcher({ versions, value, onChange, current, label = "Show version" }: VersionSwitcherProps) {
  if (versions.length < 2) return null;
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full sm:w-72" aria-label={label}>
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
