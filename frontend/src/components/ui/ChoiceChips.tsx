import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChoiceChipsProps {
  label: string;
  options: { id: string; name: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

/** Pick any number of options. Each chip is a toggle button, so it works with the keyboard. */
export function ChoiceChips({ label, options, value, onChange }: ChoiceChipsProps) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.id)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm",
              on ? "border-ink-strong bg-surface-sunken text-ink-strong" : "border-line-strong text-ink hover:border-ink-strong",
            )}
          >
            {on && <Check className="size-3.5" aria-hidden />}
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
