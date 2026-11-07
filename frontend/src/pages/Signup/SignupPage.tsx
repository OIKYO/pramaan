import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";

/** A new company signs up; the route guard then opens its setup checklist. */
export function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm onCreated={() => undefined} />
    </AuthLayout>
  );
}
