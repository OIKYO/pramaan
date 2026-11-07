import { RadioGroup } from "radix-ui";
import type { Dataset, ImportSpec } from "@/api/types";

/** Choose what to import. Each option says what it holds. */
export function DatasetPicker({ specs, value, onChange }: { specs: ImportSpec[]; value: Dataset; onChange: (d: Dataset) => void }) {
  return (
    <RadioGroup.Root aria-label="What to import" value={value} onValueChange={(v) => onChange(v as Dataset)} className="flex flex-col gap-1.5">
      {specs.map((spec) => (
        <RadioGroup.Item
          key={spec.dataset}
          value={spec.dataset}
          className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-left hover:border-line-strong data-checked:border-accent data-checked:ring-1 data-checked:ring-accent"
        >
          <span className="font-medium text-ink-strong">{spec.title}</span>
          <span className="text-xs text-pretty text-muted-text">{spec.description}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
