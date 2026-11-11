import { useConsentRequests, useRevokeConsentRequest } from "@/api/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL, CONSENT_STATUS, formatDate } from "@/lib/labels";

export function ConsentRequestList({ topperId }: { topperId: string }) {
  const requests = useConsentRequests(topperId);
  const revoke = useRevokeConsentRequest(topperId);
  const list = requests.data ?? [];
  if (requests.isPending) return <p className="text-sm text-muted-text">Loading consent links…</p>;
  if (requests.isError) return <p className="text-sm text-blocked">The consent links didn't load: {requests.error.message}</p>;
  if (list.length === 0) return null;

  return (
    <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
      {list.map((r) => {
        const status = CONSENT_STATUS[r.status];
        const when = r.withdrawn_at ?? r.decided_at;
        return (
          <li key={r.id} className="flex flex-col gap-1.5 px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
              <span className="text-xs text-muted-text">Made {formatDate(r.created_at)}</span>
            </div>
            <p className="text-ink">
              {r.poster_title ? `For “${r.poster_title}”` : "From the register"} · {r.channels.map((c) => CHANNEL_LABEL[c]).join(", ")} · until {formatDate(r.valid_until)}
            </p>
            {r.signer_name && when && (
              <p className="text-xs text-muted-text">
                {r.signer_name}{r.signer_relation === "guardian" ? " (parent or guardian)" : ""} · {formatDate(when)}
              </p>
            )}
            {r.decline_reason && <p className="text-xs text-muted-text">“{r.decline_reason}”</p>}
            {r.status === "pending" && (
              <Button size="sm" variant="ghost" className="self-start" disabled={revoke.isPending}
                onClick={() => revoke.mutate(r.id, { onSuccess: () => toast.success("Link cancelled."), onError: (e) => toast.error(e.message) })}>
                Cancel link
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
