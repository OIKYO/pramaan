import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "./ProductPreview";

/** What Pramaan does, in one line, the two ways in, and the product itself underneath. */
export function Hero() {
  return (
    <section id="how" className="scroll-mt-20">
      <div className="flex flex-col items-center gap-6 px-5 pt-16 pb-12 text-center sm:px-8 sm:pt-24 lg:px-12">
        <h1 className="max-w-4xl text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl xl:text-7xl">
          Check every branch poster before publication
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-text sm:text-lg">
          Pramaan reads each poster your branches make, checks it against head office's rulebooks, and marks every problem
          with the rule and exact fix. Regional managers review it; head office gives final approval. The AI never approves
          anything.
        </p>
        <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:w-auto sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/signup">Create organisation</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/product#how-a-poster-goes-through-pramaan">See how it works</Link>
          </Button>
        </div>
      </div>
      <div className="px-3 pb-10 sm:px-8 lg:px-12">
        <ProductPreview />
      </div>
    </section>
  );
}
