import { Popover as P } from "radix-ui";
import type { ReactNode } from "react";
import { popClasses } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  matchWidth?: boolean;
  className?: string;
}

export function Popover({ open, onOpenChange, trigger, children, matchWidth = false, className }: PopoverProps) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      <P.Trigger asChild>{trigger}</P.Trigger>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            "z-50 rounded-md border border-line bg-surface text-sm shadow-overlay outline-none",
            popClasses,
            matchWidth && "w-(--radix-popover-trigger-width)",
            className,
          )}
        >
          {children}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
