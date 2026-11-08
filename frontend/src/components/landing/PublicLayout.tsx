import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />
      <main className="flex w-full flex-1 flex-col overflow-x-clip">{children}</main>
      <LandingFooter />
    </div>
  );
}
