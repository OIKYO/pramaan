import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "./ProductPreview";

/** What Pramaan is, in one sentence, and the two ways in. */
export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-24">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl sm:leading-tight">Check every branch poster before it goes out.</h1>
        <p className="max-w-lg text-base text-pretty text-muted-text">
          Pramaan reads each poster, checks it against your brand kit, approved facts and consent records, and marks every
          problem on the poster with the fix. Your reviewers approve it. The AI never does.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/signup">Create your organisation</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login">Explore the demo</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-text">The demo organisation, and everyone in it, is fictional.</p>
      </div>
      <ProductPreview />
    </section>
  );
}
