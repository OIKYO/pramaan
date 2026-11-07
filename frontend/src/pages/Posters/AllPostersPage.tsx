import { PosterListPage } from "./PosterListPage";

export function AllPostersPage() {
  return (
    <PosterListPage
      scope="all"
      title="All posters"
      description="Every poster you can see, at any stage."
      emptyTitle="No posters yet"
      emptyText="Posters appear here once a branch uploads one."
      showBranch
      browsable
    />
  );
}
