import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useProfile, useSession } from "@/api/hooks/useSession";
import type { Role } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

const WORK: Record<Role, NavItem[]> = {
  branch_staff: [
    { to: "/branch", label: "My posters" },
    { to: "/branch/new", label: "New poster" },
  ],
  regional_manager: [{ to: "/review", label: "Review queue" }],
  head_office: [
    { to: "/approvals", label: "Final approvals" },
    { to: "/review", label: "Regional review" },
    { to: "/insights", label: "Insights" },
    { to: "/audit", label: "Audit log" },
  ],
};

const RULEBOOK: NavItem[] = [
  { to: "/rulebook/brand", label: "Brand kit" },
  { to: "/rulebook/courses", label: "Courses and fees" },
  { to: "/rulebook/results", label: "Results figures" },
  { to: "/rulebook/toppers", label: "Toppers register" },
  { to: "/rulebook/rules", label: "Rules" },
];

export const HOME: Record<Role, string> = { branch_staff: "/branch", regional_manager: "/review", head_office: "/approvals" };

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-xs font-semibold text-muted-text">{title}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            cn("rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-ink-soft", isActive && "bg-ink text-white hover:bg-ink")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

/** The frame around every signed-in page: navigation for the person's role, and who's signed in. */
export function AppShell() {
  const profile = useProfile();
  const { signOut } = useSession();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border-b border-line bg-surface p-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div>
          <p className="font-heading text-2xl font-bold text-ink">Pramaan</p>
          <p className="text-xs text-muted-text">Northfield Academy poster checks</p>
        </div>
        <nav aria-label="Main" className="flex flex-wrap gap-6 lg:flex-col">
          <NavGroup title="Work" items={WORK[profile.role]} />
          <NavGroup title="Rulebook" items={RULEBOOK} />
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium text-ink">{profile.full_name}</p>
            <p className="text-xs text-muted-text">{ROLE_LABEL[profile.role]}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-[var(--content-width)] p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
