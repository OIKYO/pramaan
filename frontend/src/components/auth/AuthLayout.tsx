import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginHero } from "./LoginHero";

/** The sign-in screen: the brand panel on one side, the way in on the other. Stacked on phones. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <LoginHero />
      <main className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted-text">Demo data: Northfield Academy is fictional, and so is everyone in it.</p>
      </main>
    </div>
  );
}
