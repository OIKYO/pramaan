import { useState } from "react";
import type { Version } from "@/api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { problemsOf } from "@/lib/findings";

function VersionPicker({ versions, value, onChange }: { versions: Version[]; value: number; onChange: (v: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-40" aria-label="Version">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {versions.map((v) => (
          <SelectItem key={v.id} value={String(v.version)}>
            Version {v.version}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ruleIds = (v: Version) => new Set(problemsOf(v).map((p) => p.finding.rule_id));

/** Two versions side by side, with which problems were fixed and which are new. */
export function VersionCompare({ versions }: { versions: Version[] }) {
  const [left, setLeft] = useState(Math.max(1, versions.length - 1));
  const [right, setRight] = useState(versions.length);
  const a = versions.find((v) => v.version === left) ?? versions[0];
  const b = versions.find((v) => v.version === right) ?? versions[versions.length - 1];
  const before = ruleIds(a);
  const after = ruleIds(b);
  const fixed = [...before].filter((id) => !after.has(id));
  const added = [...after].filter((id) => !before.has(id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {fixed.map((id) => (
          <ToneBadge key={id} tone="passed">Fixed: {id}</ToneBadge>
        ))}
        {added.map((id) => (
          <ToneBadge key={id} tone="blocked">New: {id}</ToneBadge>
        ))}
        {!fixed.length && !added.length && <span className="text-muted-text">The same checks fail in both versions.</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { version: a, value: left, set: setLeft },
          { version: b, value: right, set: setRight },
        ].map(({ version, value, set }, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <VersionPicker versions={versions} value={value} onChange={set} />
              <span className="text-sm text-muted-text">{problemsOf(version).length} problems</span>
            </div>
            {version.image_url && (
              <img src={version.image_url} alt={`Version ${version.version}`} className="w-full rounded-lg border border-line" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
