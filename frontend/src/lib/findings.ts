/** The order of findings here sets the numbers on the poster boxes and in the findings list. */
import type { Finding, Version } from "@/api/types";

export type Box = [number, number, number, number]; // [ymin, xmin, ymax, xmax], 0-1000

export interface Problem {
  number: number;
  finding: Finding;
  box: Box | null;
}

const ORDER = { block: 0, needs_human: 1, warn: 2, pass: 3 } as const;

export function boxOf(finding: Finding): Box | null {
  const box = finding.evidence?.box_2d;
  if (!Array.isArray(box) || box.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = box.map(Number);
  return ymax > ymin && xmax > xmin ? [ymin, xmin, ymax, xmax] : null; // caption flags use [0,0,0,0]
}

export function problemsOf(version: Version): Problem[] {
  return version.findings
    .filter((f) => f.severity !== "pass")
    .sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.rule_id.localeCompare(b.rule_id))
    .map((finding, i) => ({ number: i + 1, finding, box: boxOf(finding) }));
}

export const passesOf = (version: Version) => version.findings.filter((f) => f.severity === "pass");

export const openBlockingOf = (version: Version) =>
  version.findings.filter((f) => f.status === "open" && (f.severity === "block" || f.severity === "needs_human"));
