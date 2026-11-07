import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useHealth } from "@/api/hooks/useHealth";
import "./index.css";

function Placeholder() {
  const health = useHealth();
  const status = health.isPending ? "checking…" : health.isError ? health.error.message : "API is up";
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Pramaan</h1>
      <p className="text-muted-foreground">{status}</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <Placeholder />
    </QueryClientProvider>
  </StrictMode>,
);
