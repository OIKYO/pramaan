import { useState } from "react";
import type { AuditEntry } from "@/api/types";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/States";
import { auditLabel } from "@/lib/labels";
import { AuditTable } from "./AuditTable";

type Kind = "all" | "ai" | "posters" | "people";

const KIND: Record<Kind, (e: AuditEntry) => boolean> = {
  all: () => true,
  ai: (e) => e.action === "ai_call",
  posters: (e) => e.action.startsWith("poster_") || e.action.startsWith("finding_"),
  people: (e) => /^(member_|password_|organisation_|data_|consent_)/.test(e.action),
};
const LABELS: Record<Kind, string> = { all: "Everything", ai: "AI calls", posters: "Posters", people: "Team and data" };

export function AuditBrowser({ entries }: { entries: AuditEntry[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [query, setQuery] = useState("");
  const options: Segment<Kind>[] = (Object.keys(LABELS) as Kind[]).map((value) => ({
    value, label: LABELS[value], count: entries.filter(KIND[value]).length,
  }));
  const needle = query.trim().toLowerCase();
  const shown = entries
    .filter(KIND[kind])
    .filter((e) => !needle || `${e.actor_name ?? "pramaan"} ${auditLabel(e.action)}`.toLowerCase().includes(needle));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl label="Show" value={kind} onChange={setKind} options={options} />
        <SearchInput label="Search the audit log" placeholder="Search person or action" value={query} onChange={setQuery} />
      </div>
      {shown.length === 0 ? <EmptyState title="Nothing matches">Try another filter, or clear the search.</EmptyState> : <AuditTable entries={shown} />}
    </div>
  );
}
