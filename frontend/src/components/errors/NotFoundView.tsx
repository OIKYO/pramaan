import { Link } from "react-router";
import { useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { HOME } from "@/layouts/nav";

export function NotFoundView() {
  const { profile } = useSession();
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <p aria-hidden className="text-7xl font-semibold tracking-tight text-line-strong sm:text-9xl">404</p>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl">This page doesn't exist</h1>
        <p className="text-muted-text">The link may be old, or the page may have moved. Nothing is lost: everything else is where you left it.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {profile ? (
          <Button asChild><Link to={HOME[profile.role]}>Back to your dashboard</Link></Button>
        ) : (
          <>
            <Button asChild><Link to="/">Go to the home page</Link></Button>
            <Button variant="secondary" asChild><Link to="/login">Sign in</Link></Button>
          </>
        )}
      </div>
    </section>
  );
}
