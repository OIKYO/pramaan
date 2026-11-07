import type { PosterStatus, ReviewStage } from "@/api/types";
import { cn } from "@/lib/utils";

const STEPS = ["Checked", "Regional review", "Head office", "Approved"];

type StepState = "done" | "current" | "returned" | "todo";

/** Where each step stands for a poster's status. */
function stepsFor(status: PosterStatus, stage: ReviewStage | null): { states: StepState[]; note: string } {
  const at = (current: number, state: StepState = "current") =>
    STEPS.map((_, i): StepState => (i < current ? "done" : i === current ? state : "todo"));
  switch (status) {
    case "draft":
      return { states: at(0), note: "The checks are running." };
    case "checked":
      return { states: at(1, "todo"), note: "Checked. The branch hasn't submitted it for review yet." };
    case "changes_requested":
      return { states: at(0, "returned"), note: "Sent back. The branch uploads a fixed version, and the checks run again." };
    case "in_review":
      return stage === "head_office"
        ? { states: at(2), note: "The regional manager approved it. Waiting for head office." }
        : { states: at(1), note: "Waiting for the regional manager." };
    case "approved":
      return { states: STEPS.map(() => "done"), note: "Approved by head office. The branch can publish it." };
  }
}

const BAR: Record<StepState, string> = {
  done: "bg-ink-strong",
  current: "bg-action",
  returned: "bg-blocked",
  todo: "bg-line",
};

/** The poster's path from checks to approval, as four segments, with one line on where it is now. */
export function StatusTrack({ status, stage }: { status: PosterStatus; stage: ReviewStage | null }) {
  const { states, note } = stepsFor(status, stage);
  return (
    <div className="flex flex-col gap-2.5">
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Review progress">
        {STEPS.map((step, i) => (
          <li key={step} className="flex flex-col gap-1.5" aria-current={states[i] === "current" || states[i] === "returned" ? "step" : undefined}>
            <span aria-hidden className={cn("h-1 rounded-full", BAR[states[i]])} />
            <span className={cn("text-xs font-semibold", states[i] === "todo" ? "text-muted-text" : "text-ink-strong")}>
              {step}
              <span className="sr-only">: {states[i] === "todo" ? "not yet" : states[i]}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-text">{note}</p>
    </div>
  );
}
