import type { Review } from "@/api/types";
import { CONSENT_REVIEW_LABEL, formatDateTime, REVIEW_ACTION_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function ReviewHistory({ reviews }: { reviews: Review[] }) {
  return (
    <ol className="flex max-w-2xl flex-col">
      {reviews.map((review) => {
        const saving = review.id.startsWith("pending-");
        return (
          <li key={review.id} className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
            <div aria-hidden className="flex flex-col items-center pt-1.5">
              <span className={cn("size-3 shrink-0 rounded-full border-2", saving ? "border-accent bg-surface" : "border-ink-strong bg-ink-strong")} />
              <span className="w-px flex-1 bg-line group-last:hidden" />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 pb-5 text-sm group-last:pb-0">
              <p>
                <span className="font-semibold text-ink-strong">{review.actor_name}</span> {(review.actor_id ? null : CONSENT_REVIEW_LABEL[review.action]) ?? REVIEW_ACTION_LABEL[review.action] ?? review.action}
                <span className="text-muted-text"> · {saving ? "saving…" : formatDateTime(review.created_at)}</span>
              </p>
              {review.comment && <p className="rounded-sm border border-line bg-surface px-3 py-2 text-ink">{review.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
