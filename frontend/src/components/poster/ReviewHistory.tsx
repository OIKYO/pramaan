import type { Review } from "@/api/types";
import { formatDateTime, REVIEW_ACTION_LABEL } from "@/lib/labels";

/** Who did what to the poster, and their comments, oldest first. */
export function ReviewHistory({ reviews }: { reviews: Review[] }) {
  return (
    <ol className="flex flex-col gap-3 border-l-2 border-line pl-4">
      {reviews.map((review) => (
        <li key={review.id} className="text-sm">
          <p>
            <span className="font-semibold text-ink">{review.actor_name}</span>{" "}
            {REVIEW_ACTION_LABEL[review.action] ?? review.action}
            <span className="text-muted-text"> · {formatDateTime(review.created_at)}</span>
          </p>
          {review.comment && <p className="mt-1 rounded bg-ink-soft px-3 py-2 text-ink">{review.comment}</p>}
        </li>
      ))}
    </ol>
  );
}
