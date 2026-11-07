import type { ReactNode } from "react";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

/** The public pages' frame: the top bar, the page at full width, and the footer. Sections share one
 * side margin (px-5, sm:px-8, lg:px-12). */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <LandingFooter />
    </div>
  );
}
