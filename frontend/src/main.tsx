import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { SessionProvider } from "@/api/hooks/useSession";
import { queryClient } from "@/api/queryClient";
import { CookieNotice } from "@/components/ui/CookieNotice";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { Toaster } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "@/routes";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <MotionProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" />
            <CookieNotice />
          </TooltipProvider>
        </MotionProvider>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
);
