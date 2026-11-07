import type { LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  /** Shows a tick: for picking one of a few options, like the theme. */
  checked?: boolean;
}

interface MenuProps {
  trigger: ReactNode;
  items: (MenuItem | "separator")[];
  label?: string;
  align?: "start" | "end";
  side?: "top" | "bottom";
}

/** A dropdown of actions for a row or the account. Arrow keys move, Enter picks, Esc closes. */
export function Menu({ trigger, items, label, align = "end", side = "bottom" }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={6}
          className="z-50 min-w-52 rounded-md border border-line bg-surface p-1 text-sm shadow-overlay"
        >
          {label && <DropdownMenu.Label className="px-2 py-1.5 text-xs text-muted-text">{label}</DropdownMenu.Label>}
          {items.map((item, i) =>
            item === "separator" ? (
              <DropdownMenu.Separator key={`separator-${i}`} className="my-1 h-px bg-line" />
            ) : (
              <DropdownMenu.Item
                key={item.label}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-sm px-2 outline-none data-disabled:opacity-50 data-highlighted:bg-surface-sunken",
                  item.danger ? "text-blocked" : "text-ink-strong",
                )}
              >
                {item.icon && <item.icon className={cn("size-4", item.danger ? "text-blocked" : "text-muted-text")} aria-hidden />}
                <span className="flex-1">{item.label}</span>
                {item.checked && <span aria-label="current" className="size-1.5 rounded-full bg-accent" />}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
