import { ContentPage } from "@/components/content/ContentPage";
import { PublicLayout } from "@/components/landing/PublicLayout";
import source from "@/content/product.md?raw";

export function ProductPage() {
  return (
    <PublicLayout>
      <ContentPage source={source} />
    </PublicLayout>
  );
}
