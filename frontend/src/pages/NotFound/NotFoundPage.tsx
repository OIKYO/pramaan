import { NotFoundView } from "@/components/errors/NotFoundView";
import { PublicLayout } from "@/components/landing/PublicLayout";

export function NotFoundPage() {
  return (
    <PublicLayout>
      <NotFoundView />
    </PublicLayout>
  );
}
