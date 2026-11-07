import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

/** Signing in; the route guard takes signed-in people on to their work. */
export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm onSignedIn={() => undefined} />
    </AuthLayout>
  );
}
