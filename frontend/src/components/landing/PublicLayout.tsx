import type { ReactNode } from "react";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

/** The public pages' frame: the top bar, the page between two hairline rails, and the footer. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col sm:px-8">{children}</main>
      <LandingFooter />
    </div>
  );
}
