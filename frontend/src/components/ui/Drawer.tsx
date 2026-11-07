import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "./sheet";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** "left" for navigation on phones; "right" (default) for editing and uploading. */
  side?: "left" | "right";
  wide?: boolean;
}

/** A side panel for editing a record, uploading a new version, or the menu on phones. */
export function Drawer({ open, onOpenChange, title, description, children, footer, side = "right", wide = false }: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("w-full gap-0 overflow-y-auto", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle className="pr-8 text-lg font-semibold text-ink-strong">{title}</SheetTitle>
          {description && <SheetDescription className="text-muted-text">{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex flex-col gap-4 p-5">{children}</div>
        {footer && <SheetFooter className="border-t border-line px-5 py-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
