import { ContentPage } from "@/components/content/ContentPage";
import { PublicLayout } from "@/components/landing/PublicLayout";
import source from "@/content/enterprise.md?raw";

/** /enterprise: the text is in src/content/enterprise.md. */
export function EnterprisePage() {
  return (
    <PublicLayout>
      <ContentPage source={source} />
    </PublicLayout>
  );
}
