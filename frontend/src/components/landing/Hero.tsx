import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "./ProductPreview";

/** What Pramaan does, in one line, the two ways in, and the product itself underneath. */
export function Hero() {
  return (
    <section id="how" className="scroll-mt-20">
      <div className="flex flex-col items-center gap-6 px-5 pt-16 pb-12 text-center sm:px-8 sm:pt-24 lg:px-12">
        <h1 className="max-w-4xl text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl xl:text-7xl">
          Check every branch poster before it goes out
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-text sm:text-lg">
          Pramaan reads each poster your branches make, checks it against head office's rulebooks, and marks every problem
          with the fix. Your reviewers approve it. The AI never does.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button size="lg" asChild>
            <Link to="/signup">Create organisation</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login">Explore the demo</Link>
          </Button>
        </div>
      </div>
      <div className="px-3 pb-10 sm:px-8 lg:px-12">
        <ProductPreview />
      </div>
    </section>
  );
}
