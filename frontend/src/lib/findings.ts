/** The order of findings here sets the numbers on the poster boxes and in the findings list. */
import type { Finding, Version } from "@/api/types";

export type Box = [number, number, number, number]; // [ymin, xmin, ymax, xmax], 0-1000

export interface Problem {
  number: number;
  finding: Finding;
  box: Box | null;
  page: number | null;
}

/** Boxes on a post with several pages are stacked: page n (from 0) has y from 1000 * n. */
export const PAGE_SPAN = 1000;

const ORDER = { block: 0, needs_human: 1, warn: 2, pass: 3 } as const;

export function boxOf(finding: Finding): Box | null {
  const box = finding.evidence?.box_2d;
  if (!Array.isArray(box) || box.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = box.map(Number);
  return ymax > ymin && xmax > xmin ? [ymin, xmin, ymax, xmax] : null; // caption flags use [0,0,0,0]
}

function placeOf(finding: Finding): { page: number | null; box: Box | null } {
  const stacked = boxOf(finding);
  if (stacked) {
    const page = Math.floor(stacked[0] / PAGE_SPAN);
    const top = page * PAGE_SPAN;
    return { page, box: [stacked[0] - top, stacked[1], Math.min(stacked[2] - top, PAGE_SPAN), stacked[3]] };
  }
  const page = finding.evidence?.page;
  return { page: typeof page === "number" ? page - 1 : null, box: null };
}

export function problemsOf(version: Version): Problem[] {
  return version.findings
    .filter((f) => f.severity !== "pass")
    .sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.rule_id.localeCompare(b.rule_id))
    .map((finding, i) => ({ number: i + 1, finding, ...placeOf(finding) }));
}

export const pagesOf = (version: Version) =>
  version.pages && version.pages.length > 0 ? version.pages : [{ index: 0, image_url: version.image_url }];

export const passesOf = (version: Version) => version.findings.filter((f) => f.severity === "pass");

export const openBlockingOf = (version: Version) =>
  version.findings.filter((f) => f.status === "open" && (f.severity === "block" || f.severity === "needs_human"));
