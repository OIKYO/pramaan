import { useState } from "react";
import { useSaveBrandKit } from "@/api/hooks/useRulebook";
import type { BrandKit } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/ChipInput";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/Panel";
import { Swatch } from "@/components/ui/Swatch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/Toast";
import { LogoField } from "./LogoField";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** The brand kit, edited in place by head office and read by everyone else. */
export function BrandKitEditor({ kit, canEdit }: { kit: BrandKit; canEdit: boolean }) {
  const save = useSaveBrandKit();
  const initial = { registered_name: kit.registered_name, helpline: kit.helpline, palette: kit.palette, banned_phrases: kit.banned_phrases, tone_notes: kit.tone_notes };
  const [form, setForm] = useState(initial);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const submit = () =>
    save.mutate(
      { org_id: kit.org_id, ...form, registered_name: form.registered_name.trim(), helpline: form.helpline.trim(), tone_notes: form.tone_notes.trim() },
      { onSuccess: () => toast.success("Brand kit saved."), onError: (e) => toast.error(`The brand kit wasn't saved: ${e.message}`) },
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel title="Identity" description="What every poster must carry (BRAND-01 to BRAND-03).">
          <div className="flex flex-col gap-5">
            <Field label="Registered name" hint="Exactly as it must appear on posters.">
              <Input value={form.registered_name} onChange={(e) => set({ registered_name: e.target.value })} readOnly={!canEdit} />
            </Field>
            <Field label="Helpline">
              <Input value={form.helpline} onChange={(e) => set({ helpline: e.target.value })} readOnly={!canEdit} placeholder="+91 …" />
            </Field>
            <LogoField orgId={kit.org_id} path={kit.logo_path} canEdit={canEdit} />
            <ChipInput label="Palette" values={form.palette} onChange={(palette) => set({ palette })} readOnly={!canEdit}
              placeholder="#14213D" validate={(v) => (HEX.test(v) ? null : "Write a hex colour like #14213D.")} renderChip={(c) => <Swatch color={c.toUpperCase()} />} />
          </div>
        </Panel>
        <Panel title="Words" description="The AI judges tone against the notes (BRAND-04). Banned phrases block (CCPA-01).">
          <div className="flex flex-col gap-5">
            <Field label="Tone of voice">
              <Textarea value={form.tone_notes} onChange={(e) => set({ tone_notes: e.target.value })} rows={5} readOnly={!canEdit} />
            </Field>
            <ChipInput label="Banned phrases" values={form.banned_phrases} onChange={(banned_phrases) => set({ banned_phrases })} readOnly={!canEdit}
              placeholder="e.g. rank guaranteed" />
            <p className="text-xs text-muted-text">Added to the built-in English, Hindi and Bengali list of guarantee claims.</p>
          </div>
        </Panel>
      </div>
      {canEdit && dirty && (
        <div className="flex items-center justify-end gap-2 rounded-lg border border-line bg-surface px-4 py-3">
          <span className="mr-auto text-sm text-muted-text">You have unsaved changes.</span>
          <Button variant="ghost" onClick={() => setForm(initial)}>Discard</Button>
          <Button onClick={submit} disabled={save.isPending}>Save changes</Button>
        </div>
      )}
    </div>
  );
}
