import { Menu as MenuIcon } from "lucide-react";
import { useState } from "react";
import type { Role } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { AccountMenu } from "./AccountMenu";
import { NavList } from "./NavList";
import { OrgHeader } from "./OrgHeader";

/** On phones and small tablets: the organisation and a menu button; the menu slides in from the left. */
export function MobileBar({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-2 lg:hidden">
      <OrgHeader />
      <Button variant="ghost" size="icon" aria-label="Open the menu" onClick={() => setOpen(true)}>
        <MenuIcon className="size-5" />
      </Button>
      <Drawer side="left" open={open} onOpenChange={setOpen} title="Menu">
        <NavList role={role} onNavigate={() => setOpen(false)} />
        <div className="border-t border-line pt-3">
          <AccountMenu side="top" />
        </div>
      </Drawer>
    </header>
  );
}
