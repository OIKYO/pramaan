import { ChevronRight, type LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";
import { popClasses } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  attention?: string;
}

export interface SubMenu {
  label: string;
  icon?: LucideIcon;
  value?: string;
  items: MenuItem[];
}

interface MenuProps {
  trigger: ReactNode;
  items: (MenuItem | SubMenu | "separator")[];
  label?: string;
  align?: "start" | "end";
  side?: "top" | "bottom";
}

const PANEL = `z-50 min-w-52 rounded-md border border-line bg-surface p-1 text-sm shadow-overlay ${popClasses}`;
const ROW = "flex h-8 items-center gap-2 rounded-sm px-2 outline-none data-disabled:opacity-50 data-highlighted:bg-surface-sunken";

function Row({ item }: { item: MenuItem }) {
  return (
    <DropdownMenu.Item
      disabled={item.disabled}
      onSelect={item.onSelect}
      className={cn(ROW, item.danger ? "text-blocked" : "text-ink-strong")}
    >
      {item.icon && <item.icon className={cn("size-4", item.danger ? "text-blocked" : "text-muted-text")} aria-hidden />}
      <span className="flex-1">{item.label}</span>
      {item.checked && <span aria-label="current" className="size-1.5 rounded-full bg-accent" />}
      {item.attention && <span title={item.attention} aria-label={item.attention} className="size-2 rounded-full bg-control-on" />}
    </DropdownMenu.Item>
  );
}

export function Menu({ trigger, items, label, align = "end", side = "bottom" }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} side={side} sideOffset={6} className={PANEL}>
          {label && <DropdownMenu.Label className="truncate px-2 py-1.5 text-xs text-muted-text">{label}</DropdownMenu.Label>}
          {items.map((item, i) => {
            if (item === "separator") return <DropdownMenu.Separator key={`separator-${i}`} className="my-1 h-px bg-line" />;
            if ("items" in item) {
              return (
                <DropdownMenu.Sub key={item.label}>
                  <DropdownMenu.SubTrigger className={cn(ROW, "text-ink-strong data-[state=open]:bg-surface-sunken")}>
                    {item.icon && <item.icon className="size-4 text-muted-text" aria-hidden />}
                    <span className="flex-1">{item.label}</span>
                    {item.value && <span className="text-xs text-muted-text">{item.value}</span>}
                    <ChevronRight className="size-4 text-muted-text" aria-hidden />
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent sideOffset={6} className={cn(PANEL, "min-w-44")}>
                      {item.items.map((sub) => <Row key={sub.label} item={sub} />)}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              );
            }
            return <Row key={item.label} item={item} />;
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
