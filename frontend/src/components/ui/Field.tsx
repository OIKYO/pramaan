import { useId, type ReactElement, cloneElement, type ReactNode } from "react";
import { Label } from "./label";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="font-semibold text-ink-strong">
        {label}
      </Label>
      {cloneElement(children, {
        id,
        "aria-describedby": note ? noteId : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {note && (
        <p id={noteId} className={error ? "text-sm text-blocked" : "text-sm text-muted-text"}>
          {note}
        </p>
      )}
    </div>
  );
}
