import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

/** Nothing to show yet: say why, and what to do. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <Inbox className="size-6 text-muted-text" aria-hidden />
      <h2 className="text-lg">{title}</h2>
      {children && <div className="max-w-md text-sm text-muted-text">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Something failed: say what happened and offer a retry. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-lg border border-blocked/30 bg-blocked-soft px-6 py-10 text-center">
      <AlertCircle className="size-6 text-blocked" aria-hidden />
      <h2 className="text-lg">That didn't load</h2>
      <p className="max-w-md text-sm text-ink">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Placeholder rows while a list loads. */
export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
