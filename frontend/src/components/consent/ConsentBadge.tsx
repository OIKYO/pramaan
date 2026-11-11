import type { Topper } from "@/api/types";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { formatDate } from "@/lib/labels";

export function ConsentBadge({ topper }: { topper: Pick<Topper, "has_consent" | "consent_source" | "consent_withdrawn_at"> }) {
  if (topper.consent_source === "link") return <ToneBadge tone="passed">Given by link</ToneBadge>;
  if (topper.has_consent) return <ToneBadge tone="passed">Signed form on file</ToneBadge>;
  if (topper.consent_withdrawn_at) return <ToneBadge tone="blocked">Withdrawn {formatDate(topper.consent_withdrawn_at)}</ToneBadge>;
  return <ToneBadge tone="blocked">No consent</ToneBadge>;
}
