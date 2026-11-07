import { Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { PASSWORD_RULES, passwordNeeds, passwordScore } from "@/lib/password";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/** How long someone can stop typing before the field shows what's missing in red. */
const PAUSE_MS = 1400;

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: "new-password" | "current-password";
  /** Set after a submit attempt, so a missing requirement shows in red at once. */
  insist?: boolean;
  /** A line under the field before typing starts, e.g. "Note it down somewhere safe". */
  note?: string;
}

/**
 * A new password, checked as it's typed. It names only the next thing to fix ("Add a number"), fills
 * three small bars as each requirement is met, and turns red if the person stops typing with
 * something still missing. A tick shows when it's good. The eye shows or hides what was typed.
 */
export function PasswordInput({ label, value, onChange, autoComplete = "new-password", insist = false, note }: PasswordInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  // Each keystroke clears "paused"; a quiet spell sets it again.
  const type = (next: string) => {
    setPaused(false);
    onChange(next);
  };
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => setPaused(true), PAUSE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const needs = passwordNeeds(value);
  const red = Boolean(needs) && ((paused && value.length > 0) || insist);
  const score = passwordScore(value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-strong">{label}</label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => type(e.target.value)}
          aria-invalid={red || undefined}
          aria-describedby={`${id}-help`}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center text-muted-text hover:text-ink-strong"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {value.length > 0 && (
        <div aria-hidden className="grid grid-cols-3 gap-1">
          {PASSWORD_RULES.map((_, i) => (
            <span key={i} className={cn("h-1 rounded-full transition-colors duration-(--duration-base)",
              i < score ? (needs ? "bg-control-on" : "bg-passed") : red ? "bg-blocked/40" : "bg-line")} />
          ))}
        </div>
      )}
      <p id={`${id}-help`} aria-live="polite" className={cn("flex items-center gap-1.5 text-xs transition-colors duration-(--duration-base)",
        red ? "text-blocked" : needs ? "text-muted-text" : "text-passed")}>
        {!value ? (note ?? null) : needs ? needs : (<><Check className="size-3.5" /> Good password</>)}
      </p>
    </div>
  );
}
