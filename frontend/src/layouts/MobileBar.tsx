import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Role } from "@/api/types";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { AccountBlock } from "./AccountBlock";
import { NavList } from "./NavList";

/** On phones and small tablets: the logo and a menu button; the menu slides in from the left. */
export function MobileBar({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:hidden">
      <Link to="/" aria-label="Pramaan, go to your home page">
        <BrandLogo className="w-32 text-ink-strong" />
      </Link>
      <Button variant="ghost" size="icon" aria-label="Open the menu" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>
      <Drawer side="left" open={open} onOpenChange={setOpen} title="Menu">
        <NavList role={role} onNavigate={() => setOpen(false)} />
        <AccountBlock />
      </Drawer>
    </header>
  );
}
