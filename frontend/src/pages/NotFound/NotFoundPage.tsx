import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/States";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Button asChild>
          <Link to="/">Go to your home page</Link>
        </Button>
      }
    >
      The link may be old, or the page may have moved.
    </EmptyState>
  );
}

/** Shown when a page crashes, instead of a blank screen. */
export function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <div className="mx-auto max-w-xl p-8">
      <ErrorState
        error={new Error("Something went wrong on this page. Reload to try again; if it keeps happening, tell the Pramaan team.")}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
