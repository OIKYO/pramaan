import { NavLink } from "react-router";
import type { Role } from "@/api/types";
import { cn } from "@/lib/utils";
import { RULEBOOK, WORK } from "./nav";
import { QueueCount } from "./QueueCount";

/** The menu for a role: its work first, then the rulebook. The current page is marked in orange. */
export function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const groups = [
    { title: "Work", items: WORK[role] },
    { title: "Rulebook", items: RULEBOOK },
  ];
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-xs font-semibold text-muted-text">{group.title}</p>
          {group.items.map(({ to, label, icon: Icon, queue }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-text hover:bg-surface-sunken hover:text-ink-strong",
                  isActive &&
                    "bg-surface-sunken text-ink-strong before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-action",
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
              {queue && <QueueCount scope={queue} />}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
