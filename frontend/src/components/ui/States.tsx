import { Inbox, OctagonAlert, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export function EmptyState({ title, children, action, icon: Icon = Inbox }: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
      <Icon className="size-5 text-muted-text" aria-hidden />
      <h2 className="text-sm">{title}</h2>
      {children && <div className="max-w-sm text-sm text-pretty text-muted-text">{children}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-lg border border-blocked/30 bg-blocked-soft px-6 py-10 text-center">
      <OctagonAlert className="size-5 text-blocked" aria-hidden />
      <h2 className="text-sm">That didn't load</h2>
      <p className="max-w-md text-sm text-pretty text-ink">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Shown only after a short wait, so fast loads don't flicker. */
export function LoadingRows({ rows = 4 }: { rows?: number }) {
  const [shown, setShown] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const show = setTimeout(() => setShown(true), 150);
    const late = setTimeout(() => setSlow(true), 4000);
    return () => {
      clearTimeout(show);
      clearTimeout(late);
    };
  }, []);
  return (
    <div className="flex flex-col gap-2" role="status" aria-busy="true" aria-label="Loading">
      {slow && (
        <p className="flex items-center gap-2 pb-1 text-sm text-muted-text">
          <span aria-hidden className="size-2 animate-pulse rounded-full bg-control-on motion-reduce:animate-none" />
          Still loading. If Pramaan hasn't been used for a while, its server takes up to a minute to wake up.
        </p>
      )}
      {shown && Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
    </div>
  );
}

export function ScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
