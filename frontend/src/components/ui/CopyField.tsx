import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

/** A value to pass on (a temporary password), with a copy button. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-md border border-line-strong bg-surface-sunken py-1.5 pr-1.5 pl-3">
      <span className="sr-only">{label}</span>
      <code className="flex-1 text-sm break-all text-ink-strong select-all">{value}</code>
      <Button type="button" size="sm" variant="secondary" onClick={() => void copy()}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
