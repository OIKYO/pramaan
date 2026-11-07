import type { ReactNode } from "react";
import { Link } from "react-router";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** Sign in, sign up and choosing a password: one narrow column, nothing else to read. */
export function AuthLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Pramaan home">
          <BrandLogo className="w-32 text-ink-strong" />
        </Link>
        <div className="flex items-center gap-3 text-sm">{aside}</div>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-10 pb-16 sm:pt-20">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-muted-text sm:px-8">
        <span>Pramaan checks posters before they're published. People approve; the AI never does.</span>
        <ThemeToggle />
      </footer>
    </div>
  );
}
