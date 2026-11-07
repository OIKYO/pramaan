import { useState, type FormEvent } from "react";
import { useSaveBrandKit } from "@/api/hooks/useRulebook";
import type { BrandKit } from "@/api/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/Toast";
import { joinList, splitList } from "@/lib/lists";
import { FormFooter } from "./FormFooter";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Head office edits the brand kit. Changes apply to the next check that runs. */
export function BrandKitForm({ kit, onDone }: { kit: BrandKit; onDone: () => void }) {
  const save = useSaveBrandKit();
  const [name, setName] = useState(kit.registered_name);
  const [helpline, setHelpline] = useState(kit.helpline);
  const [palette, setPalette] = useState(joinList(kit.palette));
  const [banned, setBanned] = useState(joinList(kit.banned_phrases, "\n"));
  const [tone, setTone] = useState(kit.tone_notes);
  const colours = splitList(palette);
  const badColour = colours.find((c) => !HEX.test(c));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (badColour) return;
    save.mutate(
      { registered_name: name.trim(), helpline: helpline.trim(), palette: colours.map((c) => c.toUpperCase()), banned_phrases: splitList(banned, /\n/), tone_notes: tone.trim() },
      { onSuccess: () => toast.success("Brand kit saved."), onError: (e) => toast.error(`The brand kit wasn't saved: ${e.message}`) },
    );
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Registered name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Helpline">
        <Input value={helpline} onChange={(e) => setHelpline(e.target.value)} required />
      </Field>
      <Field label="Palette" hint="Hex colours separated by commas, e.g. #14213D, #FCA311" error={badColour ? `“${badColour}” isn't a hex colour like #14213D.` : null}>
        <Input value={palette} onChange={(e) => setPalette(e.target.value)} />
      </Field>
      <Field label="Extra banned phrases" hint="One per line. Added to the built-in English, Hindi and Bengali list (CCPA-01).">
        <Textarea value={banned} onChange={(e) => setBanned(e.target.value)} rows={4} />
      </Field>
      <Field label="Tone of voice notes" hint="The AI judges wording against these (BRAND-04).">
        <Textarea value={tone} onChange={(e) => setTone(e.target.value)} rows={5} />
      </Field>
      <FormFooter pending={save.isPending} onCancel={onDone} />
    </form>
  );
}
