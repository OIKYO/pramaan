import { useParams } from "react-router";
import { ContentPage } from "@/components/content/ContentPage";
import { PublicLayout } from "@/components/landing/PublicLayout";
import cookies from "@/content/cookies.md?raw";
import privacy from "@/content/privacy.md?raw";
import terms from "@/content/terms.md?raw";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";

const DOCS: Record<string, string> = { privacy, terms, cookies };

export function LegalPage() {
  const doc = DOCS[useParams().doc ?? ""];
  if (!doc) return <NotFoundPage />;
  return (
    <PublicLayout>
      <ContentPage source={doc} />
    </PublicLayout>
  );
}
