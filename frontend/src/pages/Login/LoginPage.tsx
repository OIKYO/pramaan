import { Navigate, useLocation, useNavigate } from "react-router";
import { useSession } from "@/api/hooks/useSession";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export function LoginPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  if (status === "signed_in") return <Navigate to={from} replace />;
  return (
    <AuthLayout>
      <LoginForm onSignedIn={() => navigate(from, { replace: true })} />
    </AuthLayout>
  );
}
