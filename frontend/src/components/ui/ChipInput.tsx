import { X } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface ChipInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  validate?: (value: string) => string | null;
  renderChip?: (value: string) => ReactNode;
  readOnly?: boolean;
}

export function ChipInput({ label, values, onChange, placeholder, validate, renderChip, readOnly = false }: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    const value = draft.trim();
    if (!value) return;
    const problem = validate?.(value) ?? (values.some((v) => v.toLowerCase() === value.toLowerCase()) ? "That's already in the list." : null);
    if (problem) return setError(problem);
    onChange([...values, value]);
    setDraft("");
    setError(null);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-strong">{label}</span>
      <ul className="flex flex-wrap gap-1.5" aria-label={label}>
        {values.length === 0 && <li className="text-sm text-muted-text">None yet.</li>}
        {values.map((value) => (
          <li key={value} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface-sunken pr-1 pl-2 text-sm text-ink-strong">
            {renderChip ? renderChip(value) : value}
            {!readOnly && (
              <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((v) => v !== value))}
                className="grid size-5 place-items-center rounded-sm text-muted-text hover:bg-line hover:text-ink-strong">
                <X className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => { setDraft(e.target.value); setError(null); }} onKeyDown={onKey} placeholder={placeholder} aria-label={`Add to ${label}`} />
          <Button type="button" variant="secondary" onClick={add} disabled={!draft.trim()}>Add</Button>
        </div>
      )}
      {error && <p className="text-sm text-blocked">{error}</p>}
    </div>
  );
}
