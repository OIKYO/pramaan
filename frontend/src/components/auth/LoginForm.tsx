import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";
import { DEMO_PASSWORD } from "@/lib/demo";
import { DemoAccounts } from "./DemoAccounts";

/** Email and password, a way to create an organisation, and the demo accounts. */
export function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const attempt = async (who: string, address: string, secret: string) => {
    setPending(who);
    setError(null);
    try {
      await signIn(address, secret);
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign in. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return setError("Enter your email and password.");
    void attempt("form", email, password);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl">Sign in to Pramaan</h1>
        <p className="text-muted-text">
          New here?{" "}
          <Link to="/signup" className="font-medium text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong">
            Create an organisation
          </Link>
        </p>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-blocked">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending !== null}>
          {pending === "form" && <Spinner />}
          Sign in
        </Button>
        <p className="text-xs text-muted-text">Forgot your password? Ask your head office to reset it from the Team page.</p>
      </form>
      {DEMO_PASSWORD && <DemoAccounts pending={pending} onPick={(email) => void attempt(email, email, DEMO_PASSWORD)} />}
    </div>
  );
}
