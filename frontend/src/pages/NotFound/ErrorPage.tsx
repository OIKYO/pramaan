import { isRouteErrorResponse, useRouteError } from "react-router";
import { ErrorState, ScreenMessage } from "@/components/ui/States";
import { NotFoundPage } from "./NotFoundPage";

/** Shown when a page crashes, instead of a blank screen. */
export function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ScreenMessage>
        <NotFoundPage />
      </ScreenMessage>
    );
  }
  return (
    <ScreenMessage>
      <ErrorState
        error={new Error("Something went wrong on this page. Reload to try again; if it keeps happening, tell the Pramaan team.")}
        onRetry={() => window.location.reload()}
      />
    </ScreenMessage>
  );
}
