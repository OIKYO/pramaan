import { ContentPage } from "@/components/content/ContentPage";
import { PublicLayout } from "@/components/landing/PublicLayout";
import source from "@/content/about.md?raw";

/** /about: the text is in src/content/about.md. */
export function AboutPage() {
  return (
    <PublicLayout>
      <ContentPage source={source} />
    </PublicLayout>
  );
}
