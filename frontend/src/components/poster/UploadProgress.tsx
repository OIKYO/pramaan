import { Elapsed } from "@/components/ui/Elapsed";
import { Spinner } from "@/components/ui/Spinner";

export function UploadProgress({ canLeave }: { canLeave: boolean }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-md border border-line bg-surface-sunken/50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-ink-strong">
        <Spinner /> Running the checks · <Elapsed />
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted-text">
        <li>The AI reads the text, people and numbers on the poster.</li>
        <li>A second reader checks every rank, fee and phone number.</li>
        <li>The checks in your rulebooks compare it with head office's records.</li>
      </ol>
      <p className="text-muted-text">
        This usually takes 10 to 30 seconds.
        {canLeave && " You can leave this page: the poster is already in My posters."}
      </p>
    </div>
  );
}
