import { useState, type FormEvent } from "react";
import type { useAnswerConsent } from "@/api/hooks/useConsent";
import type { ConsentPage } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_LABEL, formatDate } from "@/lib/labels";

type Relation = "self" | "guardian";

export function ConsentDecision({ page, answer }: { page: ConsentPage; answer: ReturnType<typeof useAnswerConsent> }) {
  const [relation, setRelation] = useState<Relation>(page.is_minor ? "guardian" : "self");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const where = page.channels.map((c) => CHANNEL_LABEL[c]).join(", ");

  const approve = (event: FormEvent) => {
    event.preventDefault();
    answer.mutate({ kind: "approve", body: { signer_name: name.trim(), relation, agree: true } });
  };
  const decline = () =>
    answer.mutate({ kind: "decline", body: { reason: reason.trim() || null } }, { onSuccess: () => setDeclining(false) });

  return (
    <form onSubmit={approve} className="flex flex-col gap-5 self-start rounded-lg border border-line bg-surface p-5 lg:sticky lg:top-8">
      <h2 className="text-lg">Your answer</h2>
      {page.is_minor ? (
        <p className="text-sm text-muted-text">{page.person_name} is under 18, so a parent or guardian answers.</p>
      ) : (
        <Field label="Who is answering">
          <SegmentedControl label="Who is answering" value={relation} onChange={setRelation}
            options={[{ value: "self", label: `I'm ${page.person_name}` }, { value: "guardian", label: "I'm a parent or guardian" }]} />
        </Field>
      )}
      <Field label="Type your full name to sign">
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={120} />
      </Field>
      <label className="flex items-start gap-3 text-sm text-ink">
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
        <span>
          I agree that {page.organisation} may show {page.person_name}'s result as above on {where} until {formatDate(page.valid_until)}.
          I can withdraw this at any time through this page.
        </span>
      </label>
      {answer.error && <p role="alert" className="text-sm text-blocked">{answer.error.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!agree || name.trim().length < 2 || answer.isPending}>
          {answer.isPending && <Spinner />} Approve
        </Button>
        <Button type="button" variant="ghost" onClick={() => setDeclining(true)} disabled={answer.isPending}>Decline</Button>
      </div>
      <p className="text-xs text-muted-text">This link can be answered until {formatDate(page.expires_at)}.</p>

      <Modal open={declining} onOpenChange={setDeclining} title="Decline"
        description={`${page.organisation} won't show ${page.person_name}'s result. You can say why, if you like.`}>
        <div className="flex flex-col gap-4">
          <Field label="Reason (optional)">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeclining(false)}>Cancel</Button>
            <Button variant="danger" onClick={decline} disabled={answer.isPending}>{answer.isPending && <Spinner />} Decline</Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
