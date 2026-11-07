import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** The public page's footer. */
export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs text-muted-text sm:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo variant="mark" className="w-6" />
          <span>Pramaan · built by team HEISEN-DE-BUG for CodeNexus India 2026</span>
        </div>
        <ThemeToggle />
      </div>
    </footer>
  );
}
