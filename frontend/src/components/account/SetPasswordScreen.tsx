import { useSession } from "@/api/hooks/useSession";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { PasswordForm } from "./PasswordForm";

export function SetPasswordScreen() {
  const { profile, signOut } = useSession();
  return (
    <AuthLayout
      aside={
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">Choose your password</h1>
          <p className="text-muted-text">
            Welcome{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}. You signed in with a temporary password from head office.
            Choose your own to continue; the temporary one then stops working.
          </p>
        </div>
        <PasswordForm submitLabel="Save and continue" />
      </div>
    </AuthLayout>
  );
}
