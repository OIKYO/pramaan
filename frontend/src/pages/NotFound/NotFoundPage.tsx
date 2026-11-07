import { NotFoundView } from "@/components/errors/NotFoundView";
import { PublicLayout } from "@/components/landing/PublicLayout";

/** Any address Pramaan doesn't know, signed in or not. */
export function NotFoundPage() {
  return (
    <PublicLayout>
      <NotFoundView />
    </PublicLayout>
  );
}
