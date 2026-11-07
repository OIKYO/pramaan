import { useState } from "react";
import type { PosterListItem } from "@/api/types";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/States";
import { PosterTable } from "./PosterTable";

type Filter = "all" | "changes" | "review" | "approved";

const MATCHES: Record<Filter, (p: PosterListItem) => boolean> = {
  all: () => true,
  changes: (p) => p.status === "checked" || p.status === "changes_requested",
  review: (p) => p.status === "in_review" || p.status === "draft",
  approved: (p) => p.status === "approved",
};
const LABELS: Record<Filter, string> = { all: "All", changes: "Not yet submitted", review: "In review", approved: "Approved" };

/** Posters with a status filter (with counts) and a search across title, branch and author. */
export function PosterList({ posters, showBranch = false }: { posters: PosterListItem[]; showBranch?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const options: Segment<Filter>[] = (Object.keys(LABELS) as Filter[]).map((value) => ({
    value, label: LABELS[value], count: posters.filter(MATCHES[value]).length,
  }));
  const needle = query.trim().toLowerCase();
  const shown = posters
    .filter(MATCHES[filter])
    .filter((p) => !needle || `${p.title} ${p.branch_name} ${p.created_by_name}`.toLowerCase().includes(needle));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl label="Show" value={filter} onChange={setFilter} options={options} />
        <SearchInput label="Search posters" placeholder="Search title, branch or person" value={query} onChange={setQuery} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No posters match">Try another filter, or clear the search.</EmptyState>
      ) : (
        <PosterTable posters={shown} showBranch={showBranch} />
      )}
    </div>
  );
}
