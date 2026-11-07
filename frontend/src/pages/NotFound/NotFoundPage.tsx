import { Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/States";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      icon={Compass}
      action={
        <Button asChild>
          <Link to="/">Go to your home page</Link>
        </Button>
      }
    >
      The link may be old, or the page may have moved.
    </EmptyState>
  );
}
