import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PosterListPage } from "../Posters/PosterListPage";

export function MyPostersPage() {
  return (
    <PosterListPage
      scope="all"
      title="My posters"
      description="Your branch's posters, where each one is in review, and what still needs fixing."
      emptyTitle="No posters yet"
      emptyText="Upload a poster and Pramaan checks it before anyone publishes it."
      browsable
      actions={
        <Button asChild>
          <Link to="/branch/new">
            <Plus /> New poster
          </Link>
        </Button>
      }
    />
  );
}
