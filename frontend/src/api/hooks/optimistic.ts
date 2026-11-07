/**
 * Optimistic updates: when a person submits, approves, confirms or edits, the screen changes at once
 * and the server's answer replaces it when it arrives. If the server refuses, the screen goes back
 * to exactly what it showed before, and the error is shown.
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { Finding, PosterDetail, PosterListItem, Review } from "../types";
import { keys } from "./keys";
import { fitsScope, type PosterScope } from "./usePosters";

export type Snapshot = [QueryKey, unknown][];

/** Stop in-flight reads of these caches (so they can't overwrite the prediction) and remember them. */
export async function snapshot(qc: QueryClient, ...prefixes: QueryKey[]): Promise<Snapshot> {
  await Promise.all(prefixes.map((queryKey) => qc.cancelQueries({ queryKey })));
  return prefixes.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
}

/** Put every remembered cache back, after the server refused a change. */
export function restore(qc: QueryClient, saved: Snapshot | undefined) {
  saved?.forEach(([queryKey, data]) => qc.setQueryData(queryKey, data));
}

const listPrefix = [...keys.posters, "list"] as const;
const detailPrefix = [...keys.posters, "detail"] as const;

/** A list row that matches a poster's detail: status, version and open problem counts. */
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

/** Show a poster's new state everywhere it's cached: its page, and every list it should (still) be in. */
export function showPoster(qc: QueryClient, detail: PosterDetail) {
  qc.setQueryData(keys.poster(detail.id), detail);
  for (const [queryKey, rows] of qc.getQueriesData<PosterListItem[]>({ queryKey: listPrefix })) {
    if (!rows) continue;
    const scope = queryKey[2] as PosterScope;
    const next = rows.map((r) => (r.id === detail.id ? toRow(r, detail) : r)).filter((r) => fitsScope(r, scope));
    qc.setQueryData(queryKey, next);
  }
}

/** The poster whose cached detail holds this finding. */
export function posterOfFinding(qc: QueryClient, findingId: string): PosterDetail | undefined {
  return qc
    .getQueriesData<PosterDetail>({ queryKey: detailPrefix })
    .map(([, detail]) => detail)
    .find((detail) => detail?.versions.some((v) => v.findings.some((f) => f.id === findingId)));
}

/** A copy of the poster with one finding changed. */
export function withFinding(detail: PosterDetail, findingId: string, patch: Partial<Finding>): PosterDetail {
  return {
    ...detail,
    versions: detail.versions.map((v) => ({
      ...v,
      findings: v.findings.map((f) => (f.id === findingId ? { ...f, ...patch } : f)),
    })),
  };
}

/** A history entry shown until the server's own arrives. */
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

/** Lists and insights depend on every poster change; fetch them again once the server has answered. */
export function refreshPosterLists(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: listPrefix });
  void qc.invalidateQueries({ queryKey: keys.insights });
}
