import { CircleCheck, CircleSlash, Clock } from "lucide-react";
import { useState } from "react";
import type { useAnswerConsent } from "@/api/hooks/useConsent";
import type { ConsentPage } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { CHANNEL_LABEL, formatDate } from "@/lib/labels";

function words(page: ConsentPage) {
  const signer = page.signer_name ? `${page.signer_name}${page.signer_relation === "guardian" ? " (parent or guardian)" : ""}` : "";
  const where = page.channels.map((c) => CHANNEL_LABEL[c]).join(", ");
  switch (page.status) {
    case "approved":
      return { icon: CircleCheck, title: "Consent given. Thank you.",
        text: `Signed by ${signer} on ${formatDate(page.decided_at!)}. ${page.organisation} may show ${page.person_name}'s result on ${where} until ${formatDate(page.valid_until)}.` };
    case "withdrawn":
      return { icon: CircleSlash, title: "Consent withdrawn",
        text: `Withdrawn on ${formatDate(page.withdrawn_at!)}. ${page.organisation} has been told, and every poster showing ${page.person_name} that was in review or approved has gone back to its branch to remove them.` };
    case "declined":
      return { icon: CircleSlash, title: "You declined",
        text: `${page.organisation} won't use ${page.person_name}'s result. If you change your mind, ask them for a new link.` };
    case "revoked":
      return { icon: Clock, title: "This link was cancelled", text: `${page.organisation} cancelled it. Ask them for a new one if you need it.` };
    default:
      return { icon: Clock, title: "This link has expired", text: `It could be answered until ${formatDate(page.expires_at)}. Ask ${page.organisation} for a new one.` };
  }
}

export function ConsentOutcome({ page, answer }: { page: ConsentPage; answer: ReturnType<typeof useAnswerConsent> }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [name, setName] = useState("");
  const { icon: Icon, title, text } = words(page);
  const withdraw = () =>
    answer.mutate({ kind: "withdraw", body: { signer_name: name.trim() } }, { onSuccess: () => setWithdrawing(false) });

  return (
    <section className="flex flex-col gap-4 self-start rounded-lg border border-line bg-surface p-5 lg:sticky lg:top-8" aria-live="polite">
      <h2 className="flex items-center gap-2 text-lg">
        <Icon className={page.status === "approved" ? "size-5 text-passed" : "size-5 text-muted-text"} aria-hidden /> {title}
      </h2>
      <p className="text-sm text-ink">{text}</p>
      {page.status === "approved" && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <p className="text-sm text-muted-text">Changed your mind? You can withdraw at any time. Keep this link to come back.</p>
          <Button variant="danger" className="self-start" onClick={() => setWithdrawing(true)}>Withdraw consent</Button>
        </div>
      )}
      <Modal open={withdrawing} onOpenChange={setWithdrawing} title="Withdraw consent"
        description={`Posters showing ${page.person_name} go back to their branch to remove them, including ones already approved.`}>
        <div className="flex flex-col gap-4">
          <Field label="Type your full name to confirm">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />
          </Field>
          {answer.error && <p role="alert" className="text-sm text-blocked">{answer.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWithdrawing(false)}>Cancel</Button>
            <Button variant="danger" onClick={withdraw} disabled={name.trim().length < 2 || answer.isPending}>
              {answer.isPending && <Spinner />} Withdraw consent
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
