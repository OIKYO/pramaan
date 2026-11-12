import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { PosterListItem } from "../types";
import { keys } from "./keys";

const LIST_COLUMNS =
  "id, title, channel, status, review_stage, current_version, updated_at, " +
  "branches(name), profiles(full_name), poster_versions(version, findings(severity, status))";

interface ListRow {
  id: string;
  title: string;
  channel: PosterListItem["channel"];
  status: PosterListItem["status"];
  review_stage: PosterListItem["review_stage"];
  current_version: number;
  updated_at: string;
  branches: { name: string };
  profiles: { full_name: string };
  poster_versions: { version: number; findings: { severity: string; status: string }[] }[];
}

function toListItem(row: ListRow): PosterListItem {
  const current = row.poster_versions.find((v) => v.version === row.current_version);
  const open = (current?.findings ?? []).filter((f) => f.status === "open" && f.severity !== "pass");
  return {
    id: row.id,
    title: row.title,
    channel: row.channel,
    status: row.status,
    review_stage: row.review_stage,
    current_version: row.current_version,
    updated_at: row.updated_at,
    branch_name: row.branches.name,
    created_by_name: row.profiles.full_name,
    blocking: open.filter((f) => f.severity === "block" || f.severity === "needs_human").length,
    open_issues: open.length,
  };
}

export type PosterScope = "all" | "regional_review" | "final_approval";

export function fitsScope(poster: Pick<PosterListItem, "status" | "review_stage">, scope: PosterScope): boolean {
  if (scope === "regional_review") return poster.status === "in_review" && poster.review_stage === "regional";
  if (scope === "final_approval") return poster.status === "in_review" && poster.review_stage === "head_office";
  return true;
}

async function listPosters(scope: PosterScope): Promise<PosterListItem[]> {
  let query = supabase.from("posters").select(LIST_COLUMNS).order("updated_at", { ascending: false });
  if (scope !== "all") query = query.eq("status", "in_review");
  if (scope === "regional_review") query = query.eq("review_stage", "regional");
  if (scope === "final_approval") query = query.eq("review_stage", "head_office");
  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load posters: ${error.message}`);
  return (data as unknown as ListRow[]).map(toListItem);
}

// While a poster is being checked the list refreshes, except during this person's own upload,
// whose placeholder row a refresh would drop.
const checking = (rows: PosterListItem[] | undefined) =>
  Boolean(rows?.some((r) => r.status === "draft") && !rows.some((r) => r.pending));

export const usePosterList = (scope: PosterScope = "all") =>
  useQuery({
    queryKey: keys.posterList(scope),
    queryFn: () => listPosters(scope),
    refetchInterval: (query) => (checking(query.state.data) ? 5000 : false),
  });
