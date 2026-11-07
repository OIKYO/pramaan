import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ApiError } from "@/api/client";
import { SessionProvider } from "@/api/hooks/useSession";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { Toaster } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "@/routes";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      // Retry network blips and server errors; a 4xx (not allowed, not found) won't fix itself.
      retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <MotionProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </MotionProvider>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
);
