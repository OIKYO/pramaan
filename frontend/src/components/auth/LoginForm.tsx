import { useState, type FormEvent } from "react";
import { useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  { email: "staff.siliguri@pramaan.demo", label: "Branch staff", who: "Tara Ghosh, Siliguri branch" },
  { email: "regional.east@pramaan.demo", label: "Regional manager", who: "Vikram Bose, East region" },
  { email: "hq@pramaan.demo", label: "Head office", who: "Meera Iyer, head office" },
];
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "";

/** Three one-click demo accounts, plus email and password. */
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
      setError(e instanceof Error ? e.message : "Couldn't sign in. Try again.");
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
    <div className="flex flex-col gap-6">
      {DEMO_PASSWORD && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg">Try a demo account</h2>
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              variant="outline"
              className="h-auto justify-start py-3 text-left"
              disabled={pending !== null}
              onClick={() => void attempt(account.email, account.email, DEMO_PASSWORD)}
            >
              <span className="flex flex-col">
                <span className="font-semibold">{pending === account.email ? "Signing in…" : `Sign in as ${account.label.toLowerCase()}`}</span>
                <span className="text-xs font-normal text-muted-text">{account.who}</span>
              </span>
            </Button>
          ))}
        </section>
      )}
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <h2 className="text-lg">Or sign in with email</h2>
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
          {pending === "form" ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
