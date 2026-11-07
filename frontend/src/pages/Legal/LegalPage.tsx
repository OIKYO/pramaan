import { useParams } from "react-router";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_DOCS } from "@/components/legal/legalText";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";

/** Privacy, terms and cookies, open to everyone, signed in or not. */
export function LegalPage() {
  const doc = LEGAL_DOCS[useParams().doc ?? ""];
  if (!doc) return <NotFoundPage />;
  return (
    <PublicLayout>
      <LegalDocument doc={doc} />
    </PublicLayout>
  );
}
