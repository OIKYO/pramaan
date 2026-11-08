import { isRouteErrorResponse, useRouteError } from "react-router";
import { ErrorState, ScreenMessage } from "@/components/ui/States";
import { NotFoundPage } from "./NotFoundPage";

export function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <ScreenMessage>
      <ErrorState
        error={new Error("Something went wrong on this page. Reload to try again; if it keeps happening, tell the Pramaan team.")}
        onRetry={() => window.location.reload()}
      />
    </ScreenMessage>
  );
}
