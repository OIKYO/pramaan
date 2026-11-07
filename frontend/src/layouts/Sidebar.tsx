import { Link } from "react-router";
import type { Role } from "@/api/types";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AccountBlock } from "./AccountBlock";
import { NavList } from "./NavList";

/** The menu on wide screens: logo, the role's pages, the rulebook, and the account at the foot. */
export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-7 overflow-y-auto border-r border-line bg-surface px-3 py-5 lg:flex">
      <Link to="/" className="flex flex-col gap-1 rounded-md px-3" aria-label="Pramaan, go to your home page">
        <BrandLogo className="w-40 text-ink-strong" />
        <span className="text-xs text-muted-text">Northfield Academy · demo</span>
      </Link>
      <NavList role={role} />
      <div className="mt-auto px-3">
        <AccountBlock />
      </div>
    </aside>
  );
}
