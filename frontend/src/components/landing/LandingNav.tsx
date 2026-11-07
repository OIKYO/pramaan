import { Link } from "react-router";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/button";

/** The public page's top bar. */
export function LandingNav() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" aria-label="Pramaan home">
          <BrandLogo className="w-32 text-ink-strong" />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Account">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Create organisation</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
