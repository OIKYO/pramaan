import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { ENTERPRISE, PRODUCT } from "./links";
import { NavDropdown } from "./NavDropdown";

/** The public pages' top bar. On phones the links fold into one menu. */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" aria-label="Pramaan home" className="shrink-0">
          <BrandLogo className="w-30 text-ink-strong" />
        </Link>
        <nav aria-label="Product" className="hidden flex-1 items-center gap-1 md:flex">
          <NavDropdown label="Product" links={PRODUCT} />
          <NavDropdown label="Enterprise" links={ENTERPRISE} />
          <Link to="/#start" className="flex h-8 items-center rounded-md px-3 text-sm text-ink hover:text-ink-strong">Pricing</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/login" className="hidden h-8 items-center px-3 text-sm text-ink hover:text-ink-strong sm:flex">Sign in</Link>
          <Button asChild>
            <Link to="/signup">Create organisation</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
        </div>
      </div>
      <Drawer open={open} onOpenChange={setOpen} title="Pramaan">
        <nav aria-label="Menu" className="flex flex-col gap-6">
          {[{ title: "Product", links: PRODUCT }, { title: "Enterprise", links: ENTERPRISE }].map(({ title, links }) => (
            <div key={title} className="flex flex-col gap-1">
              <p className="text-xs text-muted-text">{title}</p>
              {links.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="py-1.5 text-ink-strong">{l.label}</Link>
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-1 border-t border-line pt-4">
            <Link to="/#start" onClick={() => setOpen(false)} className="py-1.5 text-ink-strong">Pricing</Link>
            <Link to="/login" onClick={() => setOpen(false)} className="py-1.5 text-ink-strong">Sign in</Link>
          </div>
        </nav>
      </Drawer>
    </header>
  );
}
