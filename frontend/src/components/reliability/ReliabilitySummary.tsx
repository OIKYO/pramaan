import type { Reliability } from "@/api/types";
import { Stat } from "@/components/ui/Stat";
import { formatDate } from "@/lib/labels";
import { percent, plural, readerName } from "./format";

export function ReliabilitySummary({ report }: { report: Reliability }) {
  const s = report.summary;
  const readers = Object.entries(report.readers);
  const scored = report.results.filter((p) => p.runs.length > 0).length;
  const complete = report.runs >= report.planned_runs;
  const plan = report.repeated?.length
    ? `once each, and ${report.repeated.length} of them ${plural(report.repeat_runs, "time")} to see whether the answer stays the same`
    : `${plural(report.runs_per_poster, "time")} each`;
  return (
    <section className="flex flex-col gap-6 px-5 pt-12 pb-8 sm:px-8 lg:px-12">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl text-balance sm:text-4xl">How reliable are Pramaan's checks?</h1>
        <p className="text-lg text-pretty text-muted-text">
          {report.posters} fictional test posters, each with known problems planted on it, go through the {report.mode === "live" ? "live AI reader" : "test reader"}{" "}
          {plan}, with nothing reused between runs, and every check is scored against what was planted.
          {complete
            ? " All the runs are in."
            : ` So far: ${report.runs} of ${report.planned_runs} runs, over ${scored} of the ${report.posters} posters. The rest run as the free AI quota allows, and this page updates when they do.`}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Planted problems caught" value={percent(s.catch_rate, 1)} hint={`${s.caught} of ${s.caught + s.missed} across all runs`} />
        <Stat label="False flags" value={s.false_flags} hint={`${percent(s.false_flag_rate, 1)} of the chances to flag something that wasn't there`} />
        <Stat label="Same result every run" value={`${s.consistent_posters} of ${s.compared_posters}`} hint="posters, check by check" />
        <Stat label="Runs exactly right" value={`${s.exactly_right} of ${report.runs}`} hint={`A person was asked about ${s.asked_per_run ?? 0} readings per run on average`} />
      </dl>
      <p className="text-sm text-muted-text">
        Run on {formatDate(report.generated_at)} · read by{" "}
        {readers.map(([model, n], i) => `${i ? (i === readers.length - 1 ? " and " : ", ") : ""}${readerName(model)} in ${plural(n, "run")}`).join("")}
        {report.unread_runs > 0 && ` · ${plural(report.unread_runs, "attempt")} stopped at the free AI quota; ${report.unread_runs === 1 ? "it's" : "they're"} retried, not scored`}
        {" · "}second read of numbers {report.second_reader === "tesseract" ? "by Tesseract" : report.second_reader === "off" ? "off for this run" : "perfect"}
        {" · "}dates checked as of {formatDate(report.checked_as_of)}
      </p>
    </section>
  );
}
