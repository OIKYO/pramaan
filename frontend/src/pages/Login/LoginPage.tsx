import { Navigate, useLocation, useNavigate } from "react-router";
import { useSession } from "@/api/hooks/useSession";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function LoginPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  if (status === "signed_in") return <Navigate to={from} replace />;

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="grid w-full max-w-4xl gap-10 rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-10 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-ink">
            <BrandLogo className="w-full max-w-sm" />
          </h1>
          <p className="text-lg text-ink">Every branch poster, checked before it's published.</p>
          <p className="text-muted-text">
            Pramaan reads each poster, runs 17 checks against head office's rulebook and the CCPA coaching ad
            guidelines, and shows every problem on the poster with a fix. A regional manager reviews it, then head
            office gives final approval. The AI never approves anything.
          </p>
          <p className="text-sm text-muted-text">Demo data: Northfield Academy is fictional, and so is everyone in it.</p>
        </div>
        <LoginForm onSignedIn={() => navigate(from, { replace: true })} />
      </div>
    </main>
  );
}
