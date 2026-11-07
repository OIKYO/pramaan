import { ImageUp } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PosterListPage } from "../Posters/PosterListPage";

export function MyPostersPage() {
  return (
    <PosterListPage
      scope="all"
      eyebrow="Branch"
      title="My posters"
      description="Every poster from your branch, where it is in review, and what still needs fixing."
      emptyTitle="No posters yet"
      emptyText="Upload a poster and Pramaan checks it before anyone publishes it."
      filterable
      actions={
        <Button asChild>
          <Link to="/branch/new">
            <ImageUp /> New poster
          </Link>
        </Button>
      }
    />
  );
}
