import { useState } from "react";
import type { PosterListItem } from "@/api/types";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/States";
import { PosterTable } from "./PosterTable";

type Filter = "all" | "action" | "review" | "approved";

const FILTERS: Segment<Filter>[] = [
  { value: "all", label: "All" },
  { value: "action", label: "Needs your action" },
  { value: "review", label: "In review" },
  { value: "approved", label: "Approved" },
];

const matches: Record<Filter, (p: PosterListItem) => boolean> = {
  all: () => true,
  action: (p) => p.status === "checked" || p.status === "changes_requested",
  review: (p) => p.status === "in_review" || p.status === "draft",
  approved: (p) => p.status === "approved",
};

/** A branch's posters with a filter by where they stand. Review queues use PosterTable directly. */
export function PosterList({ posters }: { posters: PosterListItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = posters.filter(matches[filter]);
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl label="Show" value={filter} onChange={setFilter} options={FILTERS} />
      {shown.length === 0 ? (
        <EmptyState title="Nothing here">No posters match this filter. Choose “All” to see every poster.</EmptyState>
      ) : (
        <PosterTable posters={shown} />
      )}
    </div>
  );
}
