import type { Role } from "@/api/types";
import { AccountMenu } from "./AccountMenu";
import { NavList } from "./NavList";
import { OrgHeader } from "./OrgHeader";

/** The menu on wide screens: the organisation at the top, the role's pages, and the account at the foot. */
export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
      <div className="px-2 pt-3 pb-2">
        <OrgHeader />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <NavList role={role} />
      </div>
      <div className="border-t border-line p-2">
        <AccountMenu />
      </div>
    </aside>
  );
}
