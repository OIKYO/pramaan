import type { PosterStatus, ReviewStage } from "@/api/types";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { statusLabel } from "@/lib/labels";

export function StatusPill({ status, stage }: { status: PosterStatus; stage: ReviewStage | null }) {
  const { label, tone } = statusLabel(status, stage);
  return (
    <ToneBadge tone={tone} dot>
      {label}
    </ToneBadge>
  );
}
