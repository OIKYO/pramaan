import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupChooser } from "@/components/auth/SignupChooser";

/** A new company signs up, or someone joins theirs with its code; the route guard then opens their
 * home page. */
export function SignupPage() {
  return (
    <AuthLayout>
      <SignupChooser onCreated={() => undefined} />
    </AuthLayout>
  );
}
