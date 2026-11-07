/** Poster lists, read straight from Supabase. Row-level security decides what each person sees:
 * branch staff their branch, regional managers their region, head office everything. */
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

/** Which posters a list shows. */
export type PosterScope = "all" | "regional_review" | "final_approval";

async function listPosters(scope: PosterScope): Promise<PosterListItem[]> {
  let query = supabase.from("posters").select(LIST_COLUMNS).order("updated_at", { ascending: false });
  if (scope === "regional_review") query = query.eq("status", "in_review").eq("review_stage", "regional");
  if (scope === "final_approval") query = query.eq("status", "in_review").eq("review_stage", "head_office");
  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load posters: ${error.message}`);
  return (data as unknown as ListRow[]).map(toListItem);
}

/** Every poster this person can see (for branch staff: their branch's posters). */
export const usePosterList = (scope: PosterScope = "all") =>
  useQuery({ queryKey: keys.posterList(scope), queryFn: () => listPosters(scope) });
