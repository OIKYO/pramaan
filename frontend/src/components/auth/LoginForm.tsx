import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";

const DEMO_ACCOUNTS = [
  { email: "staff.siliguri@pramaan.demo", label: "Branch staff", who: "Tara Ghosh, Siliguri branch" },
  { email: "regional.east@pramaan.demo", label: "Regional manager", who: "Vikram Bose, East region" },
  { email: "hq@pramaan.demo", label: "Head office", who: "Meera Iyer" },
];
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "";

/** One-click demo accounts for each role, plus email and password. */
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
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl">Sign in</h2>
        <p className="text-sm text-muted-text">{DEMO_PASSWORD ? "Pick a demo role to look around, or use your account." : "Use your Pramaan account."}</p>
      </div>
      {DEMO_PASSWORD && (
        <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void attempt(account.email, account.email, DEMO_PASSWORD)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken disabled:opacity-60"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold text-ink-strong">Sign in as {account.label.toLowerCase()}</span>
                  <span className="text-sm text-muted-text">{account.who}</span>
                </span>
                {pending === account.email ? <Spinner /> : <ArrowRight className="size-4 text-muted-text" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {DEMO_PASSWORD && <p className="text-sm font-semibold text-muted-text">Or with email</p>}
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
        <Button type="submit" size="lg" disabled={pending !== null}>
          {pending === "form" && <Spinner />}
          Sign in
        </Button>
      </form>
    </div>
  );
}
