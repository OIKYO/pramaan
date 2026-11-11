import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function ConsentFrame({ organisation, children }: { organisation?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
        <BrandLogo variant="mark" className="w-7 shrink-0" />
        {organisation && <span className="truncate text-sm text-muted-text">Consent for {organisation}</span>}
      </header>
      <main className="flex flex-1 justify-center px-4 pt-8 pb-16 sm:pt-12">
        <div className="w-full max-w-5xl">{children}</div>
      </main>
      <footer className="px-5 py-4 text-xs text-muted-text sm:px-8">
        This page is private to you: anyone with the link can answer, so don't share it. Pramaan checks posters before they're published.
      </footer>
    </div>
  );
}
