import { Check } from "lucide-react";
import { Link } from "react-router";
import { useBranches } from "@/api/hooks/useOrganisation";
import { useBrandKit, useCourses, useResultStats, useToppers } from "@/api/hooks/useRulebook";
import { useMembers } from "@/api/hooks/useTeam";
import type { Dataset } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  text: string;
  done: boolean;
  to: string;
  action: string;
  importable?: Dataset;
}

/** A new organisation's setup, worked out from what it has added so far. Gone once it's all done. */
export function SetupChecklist() {
  const kit = useBrandKit().data;
  const branches = useBranches().data;
  const courses = useCourses().data;
  const toppers = useToppers().data;
  const stats = useResultStats().data;
  const members = useMembers().data;
  if (!kit || !branches || !courses || !toppers || !stats || !members) return null;

  const steps: Step[] = [
    { title: "Complete your brand kit", text: "Registered name, helpline, logo and colours. The brand checks need all four.",
      done: Boolean(kit.registered_name && kit.helpline && kit.logo_path && kit.palette.length), to: "/rulebook/brand", action: "Open brand kit" },
    { title: "Add your branches", text: "Each branch's phone and address are checked on its posters.",
      done: branches.length > 0, to: "/organisation/branches", action: "Add branches", importable: "branches" },
    { title: "Add courses and fees", text: "Posters must name and price courses exactly as approved.",
      done: courses.length > 0, to: "/rulebook/courses", action: "Add courses", importable: "courses" },
    { title: "Add your toppers", text: "Students posters may show, with their verified rank and consent.",
      done: toppers.length > 0, to: "/rulebook/toppers", action: "Add toppers", importable: "toppers" },
    { title: "Add results figures", text: "The only success numbers a poster may claim.",
      done: stats.length > 0, to: "/rulebook/results", action: "Add figures", importable: "results" },
    { title: "Add your team", text: "Branch staff upload posters; regional managers review them.",
      done: members.length > 1, to: "/organisation/team", action: "Add people", importable: "members" },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  return (
    <Panel title="Set up your organisation" description={`${done} of ${steps.length} done. Posters are checked against what you add here.`}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-6 gap-1" aria-hidden>
          {steps.map((s) => (
            <span key={s.title} className={cn("h-1 rounded-full", s.done ? "bg-passed" : "bg-line")} />
          ))}
        </div>
        <ol className="flex flex-col divide-y divide-line">
          {steps.map((s) => (
            <li key={s.title} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border",
                  s.done ? "border-passed bg-passed text-on-tone" : "border-line-strong",
                )}
              >
                {s.done && <Check className="size-3" aria-label="Done" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={cn("font-medium", s.done ? "text-muted-text line-through" : "text-ink-strong")}>{s.title}</span>
                {!s.done && <span className="text-muted-text">{s.text}</span>}
              </div>
              {!s.done && (
                <div className="flex gap-2">
                  {s.importable && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/organisation/import?dataset=${s.importable}`}>Import CSV</Link>
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={s.to}>{s.action}</Link>
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
