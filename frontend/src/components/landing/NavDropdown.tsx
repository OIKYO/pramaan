import { ChevronDown } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useNavigate } from "react-router";
import type { LandingLink } from "./links";

/** A top-bar menu: each entry has an icon, a name and one line on what's there. */
export function NavDropdown({ label, links }: { label: string; links: LandingLink[] }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="flex h-8 items-center gap-1 rounded-md px-3 text-sm text-ink hover:text-ink-strong data-[state=open]:text-ink-strong">
        {label}
        <ChevronDown className="size-3.5 text-muted-text" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={10}
          className="z-50 grid w-[34rem] grid-cols-2 gap-1 rounded-lg border border-line bg-surface p-2 shadow-overlay"
        >
          {links.map(({ to, label: name, text, icon: Icon }) => (
            <DropdownMenu.Item
              key={name}
              onSelect={() => navigate(to)}
              className="flex cursor-pointer items-start gap-3 rounded-md p-3 outline-none data-highlighted:bg-surface-sunken"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-canvas">
                <Icon className="size-4 text-ink" aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink-strong">{name}</span>
                <span className="text-xs text-muted-text">{text}</span>
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
