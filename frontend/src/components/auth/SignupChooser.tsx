import { Building2, UserPlus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { JoinForm } from "./JoinForm";
import { SignupForm } from "./SignupForm";

type Mode = "create" | "join";
const MODES: Segment<Mode>[] = [
  { value: "create", label: "New organisation", icon: Building2 },
  { value: "join", label: "Join with a code", icon: UserPlus },
];

/** Making an account: start a new organisation, or join one with its code. ?join opens the second. */
export function SignupChooser({ onCreated }: { onCreated: () => void }) {
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.has("join") ? "join" : "create";
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl">Create your account</h1>
        <SegmentedControl label="What you're doing" value={mode} options={MODES}
          onChange={(next) => setParams(next === "join" ? { join: "" } : {}, { replace: true })} />
      </div>
      {mode === "create" ? <SignupForm onCreated={onCreated} /> : <JoinForm />}
      <p className="text-muted-text">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong">
          Sign in
        </Link>
      </p>
    </div>
  );
}
