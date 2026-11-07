import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useSession } from "@/api/hooks/useSession";
import type { Role } from "@/api/types";
import { ErrorState, LoadingRows } from "@/components/ui/States";
import { HOME } from "./AppShell";

/** Signed-in users only; everyone else goes to the login page. */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const { status, profile, profileError, signOut } = useSession();
  const location = useLocation();
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <LoadingRows rows={3} />
      </div>
    );
  }
  if (status === "signed_out") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorState error={new Error(profileError ?? "Your profile couldn't be loaded.")} onRetry={() => void signOut()} />
      </div>
    );
  }
  return children;
}

/** Pages for some roles only; others go to their own home page. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile } = useSession();
  if (profile && !roles.includes(profile.role)) return <Navigate to={HOME[profile.role]} replace />;
  return children;
}

export function RoleHome() {
  const { profile } = useSession();
  return <Navigate to={profile ? HOME[profile.role] : "/login"} replace />;
}
