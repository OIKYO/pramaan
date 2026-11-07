import { useState } from "react";
import type { Version } from "@/api/types";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { problemsOf } from "@/lib/findings";
import { VersionSwitcher } from "./VersionSwitcher";

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
  const sides = [
    { version: a, set: setLeft, label: "Earlier version" },
    { version: b, set: setRight, label: "Later version" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {fixed.map((id) => (
          <ToneBadge key={id} tone="passed">
            Fixed: {id}
          </ToneBadge>
        ))}
        {added.map((id) => (
          <ToneBadge key={id} tone="blocked">
            New: {id}
          </ToneBadge>
        ))}
        {!fixed.length && !added.length && <span className="text-muted-text">The same checks fail in both versions.</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sides.map(({ version, set, label }) => (
          <figure key={label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <VersionSwitcher versions={versions} value={version.version} onChange={set} label={label} />
              <span className="shrink-0 text-sm text-muted-text tabular-nums">{problemsOf(version).length} problems</span>
            </div>
            {version.image_url && (
              <img
                src={version.image_url}
                alt={`Version ${version.version} of the poster`}
                loading="lazy"
                decoding="async"
                className="w-full rounded-md border border-line bg-surface-sunken"
              />
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
