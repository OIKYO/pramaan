import { Share2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCreateConsentRequest } from "@/api/hooks/useConsent";
import type { Channel, ConsentRequestCreated } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { CopyField } from "@/components/ui/CopyField";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { CHANNEL_LABEL, formatDate } from "@/lib/labels";

interface ConsentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topperId: string;
  personName: string;
  versionId?: string;
  channels?: Channel[];
}

const CHANNELS = (Object.keys(CHANNEL_LABEL) as Channel[]).map((id) => ({ id, name: CHANNEL_LABEL[id] }));

function aYearFromToday() {
  const next = new Date();
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

export function ConsentLinkDialog({ open, onOpenChange, topperId, personName, versionId, channels }: ConsentLinkDialogProps) {
  const create = useCreateConsentRequest();
  const [chosen, setChosen] = useState<string[]>(channels ?? CHANNELS.map((c) => c.id));
  const [validUntil, setValidUntil] = useState(aYearFromToday);
  const [made, setMade] = useState<ConsentRequestCreated | null>(null);
  const link = made ? `${window.location.origin}/consent/${made.token}` : "";
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setMade(null);
      create.reset();
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({ topper_id: topperId, version_id: versionId ?? null, channels: chosen as Channel[], valid_until: validUntil },
      { onSuccess: setMade });
  };
  const share = () =>
    void navigator.share?.({ title: "Your consent", text: `Please look at how ${personName}'s result will be shown:`, url: link }).catch(() => undefined);

  return (
    <Modal open={open} onOpenChange={close} title={made ? "Consent link ready" : `Ask ${personName} for consent`}
      description={made
        ? `Send it to ${personName} or their parent. It can be answered until ${formatDate(made.request.expires_at)}, and isn't shown again. They can withdraw later through the same link.`
        : versionId
          ? "They'll see this exact poster and what it says about them, then approve or decline."
          : "They'll see what posters may say about them, then approve or decline."}>
      {made ? (
        <div className="flex flex-col gap-4">
          <CopyField label="Consent link" value={link} />
          <div className="flex justify-end gap-2">
            {"share" in navigator && <Button variant="secondary" onClick={share}><Share2 /> Share</Button>}
            <Button onClick={() => close(false)}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Where it may be published">
            <ChoiceChips label="Where it may be published" options={CHANNELS} value={chosen} onChange={setChosen} />
          </Field>
          <Field label="Consent lasts until" hint="Up to 2 years. They can withdraw sooner.">
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
          </Field>
          {create.error && <p role="alert" className="text-sm text-blocked">{create.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || chosen.length === 0}>
              {create.isPending && <Spinner />} Make link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
