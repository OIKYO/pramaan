import { Inbox, OctagonAlert, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

/** Nothing to show yet: say why, and what to do next. */
export function EmptyState({ title, children, action, icon: Icon = Inbox }: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-md bg-surface-sunken text-ink">
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="text-base">{title}</h2>
      {children && <div className="max-w-md text-sm text-pretty text-muted-text">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Something failed: say what happened, and offer to try again. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-md border border-blocked/40 bg-blocked-soft px-6 py-10 text-center">
      <OctagonAlert className="size-6 text-blocked" aria-hidden />
      <h2 className="text-base">That didn't load</h2>
      <p className="max-w-md text-sm text-pretty text-ink">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Placeholder rows while data loads. They appear only after a short wait, so fast loads don't flicker. */
export function LoadingRows({ rows = 4 }: { rows?: number }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 150);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="flex flex-col gap-2" role="status" aria-busy="true" aria-label="Loading">
      {shown && Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
    </div>
  );
}

/** A message that fills the screen: a page that crashed, or a profile that couldn't load. */
export function ScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
