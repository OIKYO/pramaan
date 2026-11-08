import { ContentPage } from "@/components/content/ContentPage";
import { PublicLayout } from "@/components/landing/PublicLayout";
import source from "@/content/enterprise.md?raw";

export function EnterprisePage() {
  return (
    <PublicLayout>
      <ContentPage source={source} />
    </PublicLayout>
  );
}
