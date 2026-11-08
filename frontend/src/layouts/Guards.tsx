import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@/api/hooks/useSession";
import type { Role } from "@/api/types";
import { SetPasswordScreen } from "@/components/account/SetPasswordScreen";
import { ErrorState, LoadingRows, ScreenMessage } from "@/components/ui/States";
import { HOME } from "./nav";

export function RequireSignIn({ children }: { children: ReactNode }) {
  const { status, profile, profileError, signOut } = useSession();
  const location = useLocation();
  if (status === "loading") {
    return (
      <ScreenMessage>
        <LoadingRows rows={3} />
      </ScreenMessage>
    );
  }
  if (status === "signed_out") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) {
    return (
      <ScreenMessage>
        <ErrorState error={new Error(profileError ?? "Your profile couldn't be loaded. Sign in again.")} onRetry={() => void signOut()} />
      </ScreenMessage>
    );
  }
  if (profile.needs_password_change) return <SetPasswordScreen />;
  return children;
}

export function RequireRole({ roles, children }: { roles: readonly Role[]; children?: ReactNode }) {
  const { profile } = useSession();
  if (profile && !roles.includes(profile.role)) return <Navigate to={HOME[profile.role]} replace />;
  return children ?? <Outlet />;
}

export function RoleHome() {
  const { profile } = useSession();
  return <Navigate to={profile ? HOME[profile.role] : "/login"} replace />;
}

export function PublicOnly() {
  const { status, profile } = useSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  if (status === "loading") {
    return (
      <ScreenMessage>
        <LoadingRows rows={3} />
      </ScreenMessage>
    );
  }
  if (status === "signed_in" && profile) return <Navigate to={from ?? HOME[profile.role]} replace />;
  return <Outlet />;
}
