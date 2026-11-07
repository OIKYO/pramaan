import { ChevronDown } from "lucide-react";
import { NavigationMenu as N } from "radix-ui";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ENTERPRISE, PRODUCT, type LandingLink } from "./links";

const TRIGGER =
  "group flex h-8 items-center gap-1 rounded-md px-3 text-sm text-ink outline-none hover:text-ink-strong focus-visible:ring-2 focus-visible:ring-focus data-[state=open]:text-ink-strong";
/** pt-2 keeps the pointer inside the menu while it crosses the gap under the trigger. */
const PANEL = "absolute top-full left-0 z-50 pt-2";
const CARD = "rounded-lg border border-line bg-surface p-2 shadow-overlay";

function Menu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <N.Item className="relative">
      <N.Trigger className={TRIGGER}>
        {label}
        <ChevronDown className="size-3.5 text-muted-text group-data-[state=open]:rotate-180" aria-hidden />
      </N.Trigger>
      <N.Content className={PANEL}>{children}</N.Content>
    </N.Item>
  );
}

function LinkGrid({ links }: { links: LandingLink[] }) {
  return (
    <ul className={`${CARD} grid w-[34rem] grid-cols-2 gap-1`}>
      {links.map(({ to, label, text, icon: Icon }) => (
        <li key={label}>
          <N.Link asChild>
            <Link to={to} className="flex items-start gap-3 rounded-md p-3 outline-none hover:bg-surface-sunken focus-visible:bg-surface-sunken">
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-canvas">
                <Icon className="size-4 text-ink" aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink-strong">{label}</span>
                <span className="text-xs text-muted-text">{text}</span>
              </span>
            </Link>
          </N.Link>
        </li>
      ))}
    </ul>
  );
}

/** The top bar's menus. They open on hover with a mouse, on tap on a phone, and with the keyboard. */
export function NavMenus() {
  return (
    <N.Root delayDuration={60} className="hidden flex-1 md:flex" aria-label="Product">
      <N.List className="flex items-center gap-1">
        <Menu label="Product"><LinkGrid links={PRODUCT} /></Menu>
        <Menu label="Enterprise"><LinkGrid links={ENTERPRISE} /></Menu>
        <Menu label="Pricing">
          <div className={`${CARD} flex w-80 flex-col gap-3 p-5`}>
            <p className="text-sm font-medium text-ink-strong">Free while Pramaan is in its pilot</p>
            <p className="text-sm text-muted-text">Every rulebook and every check, for as many branches as you have. No card needed.</p>
            <N.Link asChild>
              <Button asChild size="sm" className="self-start">
                <Link to="/signup">Create organisation</Link>
              </Button>
            </N.Link>
          </div>
        </Menu>
      </N.List>
    </N.Root>
  );
}
