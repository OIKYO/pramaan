import { Spinner } from "@/components/ui/Spinner";

export function ChecksRunning({ pages }: { pages: number }) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
      <Spinner className="size-5 text-muted-text" />
      <h2 className="text-sm">Checking this {pages > 1 ? "post" : "poster"}</h2>
      <p className="max-w-sm text-sm text-pretty text-muted-text">
        Pramaan is reading {pages > 1 ? `its ${pages} pages` : "it"} and running the checks. This usually takes under a
        minute, longer when the AI reader is busy. The findings appear here when they're ready.
      </p>
    </div>
  );
}
