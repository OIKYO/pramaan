import type { Version } from "@/api/types";
import { cn } from "@/lib/utils";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function VerdictSummary({ version }: { version: Version }) {
  const open = version.findings.filter((f) => f.status === "open");
  const count = (severity: string) => open.filter((f) => f.severity === severity).length;
  const blocking = count("block");
  const person = count("needs_human");
  const warnings = count("warn");
  const passed = version.findings.filter((f) => f.severity === "pass").length;

  const verdict =
    blocking + person > 0
      ? `Can't be approved yet: ${plural(blocking + person, "finding")} must be fixed, confirmed or overridden.`
      : warnings > 0
        ? `Nothing blocks approval. ${plural(warnings, "warning")} for the reviewer to weigh.`
        : "Every check passed. A reviewer still makes the final call.";

  const tiles = [
    { label: "Blocking", value: blocking, mark: "bg-blocked" },
    { label: "Needs a person", value: person, mark: "bg-info" },
    { label: "Warnings", value: warnings, mark: "bg-warning-mark" },
    { label: "Passed", value: passed, mark: "bg-passed" },
  ];

  return (
    <section aria-label="Summary" className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      <p className="font-semibold text-pretty text-ink-strong">{verdict}</p>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col-reverse gap-0.5 bg-surface px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-muted-text">
              <span aria-hidden className={cn("size-2 shrink-0 rounded-xs", t.mark)} />
              {t.label}
            </dt>
            <dd className="text-2xl font-semibold text-ink-strong tabular-nums">{t.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
