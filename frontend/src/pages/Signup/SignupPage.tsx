import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupChooser } from "@/components/auth/SignupChooser";

export function SignupPage() {
  return (
    <AuthLayout>
      <SignupChooser onCreated={() => undefined} />
    </AuthLayout>
  );
}
