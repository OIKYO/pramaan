import { logoUrl } from "@/api/hooks/useRulebook";
import type { BrandKit } from "@/api/types";
import { Panel } from "@/components/ui/Panel";
import { Swatch } from "@/components/ui/Swatch";
import { ToneBadge } from "@/components/ui/ToneBadge";

/** The brand kit as the checks see it: identity on one side, words on the other. */
export function BrandKitView({ kit }: { kit: BrandKit }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Panel title="Identity" description="Used by the logo, colour and contact checks (BRAND-01 to BRAND-03).">
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex items-center gap-4">
            {kit.logo_path ? (
              <img src={logoUrl(kit.logo_path)} alt="Northfield Academy logo" className="size-20 rounded-md border border-line bg-surface-sunken object-contain p-1" />
            ) : (
              <span className="grid size-20 place-items-center rounded-md border border-dashed border-line-strong text-xs text-muted-text">No logo</span>
            )}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              <dt className="text-muted-text">Registered name</dt>
              <dd className="font-semibold text-ink-strong">{kit.registered_name}</dd>
              <dt className="text-muted-text">Helpline</dt>
              <dd className="font-semibold text-ink-strong tabular-nums">{kit.helpline}</dd>
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-muted-text">Palette</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {kit.palette.map((c) => (
                <Swatch key={c} color={c} />
              ))}
            </div>
          </div>
        </div>
      </Panel>
      <Panel title="Words" description="The AI judges tone against these notes (BRAND-04); banned phrases block (CCPA-01).">
        <div className="flex flex-col gap-5 text-sm">
          <blockquote className="border-l-2 border-action pl-3 text-pretty text-ink">{kit.tone_notes}</blockquote>
          <div className="flex flex-col gap-2">
            <p className="text-muted-text">Extra banned phrases, on top of the built-in English, Hindi and Bengali list</p>
            <div className="flex flex-wrap gap-1.5">
              {kit.banned_phrases.length === 0 ? (
                <span className="text-muted-text">None yet.</span>
              ) : (
                kit.banned_phrases.map((p) => (
                  <ToneBadge key={p} tone="blocked">
                    {p}
                  </ToneBadge>
                ))
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
