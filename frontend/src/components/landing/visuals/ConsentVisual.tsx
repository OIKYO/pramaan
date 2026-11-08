import { FileCheck2, Lock } from "lucide-react";
import { ToneBadge } from "@/components/ui/ToneBadge";

export function ConsentVisual() {
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink-strong">Riya Sen</span>
          <span className="text-xs text-muted-text">AIR 73 · JEE Main 2026</span>
        </div>
        <ToneBadge tone="passed">Consent on file</ToneBadge>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs">
        <dt className="text-muted-text">Signed</dt>
        <dd className="text-ink-strong tabular-nums">2 May 2026, after the result</dd>
        <dt className="text-muted-text">Covers</dt>
        <dd className="text-ink-strong">Print, Instagram, WhatsApp</dd>
        <dt className="text-muted-text">Valid until</dt>
        <dd className="text-ink-strong tabular-nums">1 May 2027</dd>
      </dl>
      <div className="flex items-center gap-2 rounded-md bg-surface-sunken px-3 py-2 text-xs text-muted-text">
        <FileCheck2 className="size-3.5" />
        consent-riya-sen.pdf
        <Lock className="ml-auto size-3.5" />
        Head office only
      </div>
    </div>
  );
}
