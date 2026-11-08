import { useState, type FormEvent } from "react";
import { useChangePassword } from "@/api/hooks/useAccount";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { passwordNeeds } from "@/lib/password";

export function PasswordForm({ submitLabel = "Change password", onDone }: { submitLabel?: string; onDone?: () => void }) {
  const change = useChangePassword();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [tried, setTried] = useState(false);
  const weak = passwordNeeds(password);
  const mismatch = password !== again;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (weak || mismatch) return;
    change.mutate(password, {
      onSuccess: () => {
        toast.success("Password changed.");
        setPassword("");
        setAgain("");
        setTried(false);
        onDone?.();
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <PasswordInput label="New password" value={password} onChange={setPassword} insist={tried} />
      <Field label="Type it again" error={tried && !weak && mismatch ? "The two passwords don't match." : null}>
        <Input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
      </Field>
      <div>
        <Button type="submit" disabled={change.isPending}>
          {change.isPending && <Spinner />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
