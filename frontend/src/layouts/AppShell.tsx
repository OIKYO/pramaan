import { Outlet } from "react-router";
import { useProfile } from "@/api/hooks/useSession";
import { NavProgress } from "@/components/ui/NavProgress";
import { MobileBar } from "./MobileBar";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { role } = useProfile();
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <NavProgress />
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 font-medium text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to the page
      </a>
      <Sidebar role={role} />
      <MobileBar role={role} />
      <main id="main" className="mx-auto flex w-full max-w-(--content-width) min-w-0 flex-col gap-6 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
        <Outlet />
      </main>
    </div>
  );
}
