import type { PosterStatus, ReviewStage } from "@/api/types";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { statusLabel } from "@/lib/labels";

/** Where a poster is: being checked, with the regional manager, sent back, approved... */
export function StatusPill({ status, stage }: { status: PosterStatus; stage: ReviewStage | null }) {
  const { label, tone } = statusLabel(status, stage);
  return (
    <ToneBadge tone={tone} dot>
      {label}
    </ToneBadge>
  );
}
