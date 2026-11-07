import { PosterListPage } from "../Posters/PosterListPage";

export function ApprovalsPage() {
  return (
    <PosterListPage
      scope="final_approval"
      eyebrow="Head office"
      title="Final approvals"
      description="Posters regional managers have approved. Give final approval, override a blocking finding with a reason, or send back."
      emptyTitle="Nothing waiting for final approval"
      emptyText="Posters appear here once a regional manager approves them."
      showBranch
    />
  );
}
