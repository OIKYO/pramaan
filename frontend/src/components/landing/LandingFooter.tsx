import { Link } from "react-router";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LEGAL, PRODUCT, REPO } from "./links";

const COLUMNS = [
  { title: "Product", links: PRODUCT.map((l) => ({ to: l.to, label: l.label })) },
  {
    title: "Company",
    links: [
      { to: `${REPO}#readme`, label: "About Pramaan" },
      { to: `${REPO}/blob/main/docs/contributions.md`, label: "Team HEISEN-DE-BUG" },
    ],
  },
  {
    title: "Contact",
    links: [
      { to: `${REPO}/issues`, label: "Report a problem" },
      { to: REPO, label: "Source code" },
    ],
  },
  { title: "Legal", links: LEGAL },
];

const external = (to: string) => to.startsWith("http");

/** The public pages' footer: four columns of links, then the legal line. */
export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div>
        <div className="grid grid-cols-2 gap-10 px-5 py-14 sm:px-8 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] lg:px-12">
          <BrandLogo className="col-span-2 w-28 text-ink-strong md:col-span-1" />
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className="text-sm">{column.title}</h2>
              <ul className="flex flex-col gap-2">
                {column.links.map((l) => (
                  <li key={l.label}>
                    {external(l.to) ? (
                      <a href={l.to} target="_blank" rel="noreferrer" className="text-muted-text hover:text-ink-strong">{l.label}</a>
                    ) : (
                      <Link to={l.to} className="text-muted-text hover:text-ink-strong">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-5 text-xs text-muted-text sm:px-8 lg:px-12">
          <span>© 2026 Pramaan. Built for CodeNexus India 2026.</span>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL.map((l) => <Link key={l.to} to={l.to} className="hover:text-ink-strong">{l.label}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
