/** The app's one React Query client: how long data stays fresh and when to retry. */
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      // Retry network blips and server errors; a 4xx (not allowed, not found) won't fix itself.
      retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});
