import { PosterListPage } from "../Posters/PosterListPage";

export function ReviewQueuePage() {
  return (
    <PosterListPage
      scope="regional_review"
      eyebrow="Review"
      title="Review queue"
      description="Posters your branches have submitted. Approve them on to head office, or send them back with a comment."
      emptyTitle="Nothing waiting for review"
      emptyText="Posters appear here when a branch submits them."
      showBranch
    />
  );
}
