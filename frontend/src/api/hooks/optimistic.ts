import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { Finding, PosterDetail, PosterListItem, Review } from "../types";
import { keys } from "./keys";
import { fitsScope, type PosterScope } from "./usePosters";

export type Snapshot = [QueryKey, unknown][];

/** Cancel in-flight reads so they can't overwrite the optimistic data, and remember the caches. */
export async function snapshot(qc: QueryClient, ...prefixes: QueryKey[]): Promise<Snapshot> {
  await Promise.all(prefixes.map((queryKey) => qc.cancelQueries({ queryKey })));
  return prefixes.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
}

export function restore(qc: QueryClient, saved: Snapshot | undefined) {
  saved?.forEach(([queryKey, data]) => qc.setQueryData(queryKey, data));
}

const listPrefix = [...keys.posters, "list"] as const;
const detailPrefix = [...keys.posters, "detail"] as const;

function toRow(row: PosterListItem, detail: PosterDetail): PosterListItem {
  const current = detail.versions.find((v) => v.version === detail.current_version);
  const open = (current?.findings ?? []).filter((f) => f.status === "open" && f.severity !== "pass");
  return {
    ...row,
    status: detail.status,
    review_stage: detail.review_stage,
    current_version: detail.current_version,
    updated_at: detail.updated_at,
    blocking: open.filter((f) => f.severity === "block" || f.severity === "needs_human").length,
    open_issues: open.length,
  };
}

export function showPoster(qc: QueryClient, detail: PosterDetail) {
  qc.setQueryData(keys.poster(detail.id), detail);
  for (const [queryKey, rows] of qc.getQueriesData<PosterListItem[]>({ queryKey: listPrefix })) {
    if (!rows) continue;
    const scope = queryKey[2] as PosterScope;
    const next = rows.map((r) => (r.id === detail.id ? toRow(r, detail) : r)).filter((r) => fitsScope(r, scope));
    qc.setQueryData(queryKey, next);
  }
}

export function posterOfFinding(qc: QueryClient, findingId: string): PosterDetail | undefined {
  return qc
    .getQueriesData<PosterDetail>({ queryKey: detailPrefix })
    .map(([, detail]) => detail)
    .find((detail) => detail?.versions.some((v) => v.findings.some((f) => f.id === findingId)));
}

export function withFinding(detail: PosterDetail, findingId: string, patch: Partial<Finding>): PosterDetail {
  return {
    ...detail,
    versions: detail.versions.map((v) => ({
      ...v,
      findings: v.findings.map((f) => (f.id === findingId ? { ...f, ...patch } : f)),
    })),
  };
}

export function pendingReview(action: string, comment: string | null = null): Review {
  return {
    id: `pending-${action}-${Date.now()}`,
    version_id: null,
    actor_id: "",
    actor_name: "You",
    action,
    comment,
    created_at: new Date().toISOString(),
  };
}

export function refreshPosterLists(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: listPrefix });
  void qc.invalidateQueries({ queryKey: keys.insights });
}
