import { NavLink } from "react-router";
import { useKeeps, useVocabulary } from "@/api/hooks/useCatalog";
import type { Role } from "@/api/types";
import { cn } from "@/lib/utils";
import { navFor } from "./nav";
import { QueueCount } from "./QueueCount";

/** The menu for a role, with the rulebooks the organisation keeps. The current page is marked
 * with a bar in the accent colour. */
export function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const keeps = useKeeps();
  const words = useVocabulary();
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {navFor(role, keeps, words).map((group, i) => (
        <div key={group.title ?? i} className="flex flex-col gap-px">
          {group.title && <p className="px-2 pb-1.5 text-xs font-medium text-muted-text">{group.title}</p>}
          {group.items.map(({ to, label, icon: Icon, queue }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-ink hover:bg-surface-sunken hover:text-ink-strong",
                  isActive &&
                    "bg-surface-sunken font-medium text-ink-strong before:absolute before:inset-y-1.5 before:-left-2 before:w-0.5 before:rounded-full before:bg-accent",
                )
              }
            >
              <Icon className="size-4 shrink-0 text-muted-text group-hover:text-ink-strong group-aria-[current=page]:text-ink-strong" aria-hidden />
              {label}
              {queue && <QueueCount scope={queue} />}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
