import { useState } from "react";
import { useConsentLink, useUploadConsent } from "@/api/hooks/useRulebook";
import type { Topper } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";

/** Head office uploads the signed consent PDF and opens it through a link that expires in 2 minutes.
 * Consent files are never sent to the AI. */
export function ConsentPanel({ topper }: { topper: Topper }) {
  const upload = useUploadConsent();
  const link = useConsentLink();
  const [file, setFile] = useState<File | null>(null);
  const onError = (e: Error) => toast.error(e.message);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base">Signed consent</h3>
        {topper.has_consent ? <ToneBadge tone="passed">On file</ToneBadge> : <ToneBadge tone="blocked">Missing</ToneBadge>}
      </div>
      {topper.has_consent && (
        <Button
          type="button"
          variant="outline"
          disabled={link.isPending}
          onClick={() => link.mutate(topper.id, { onSuccess: ({ url }) => window.open(url, "_blank", "noopener"), onError })}
        >
          Open consent file
        </Button>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="consent-file">
          {topper.has_consent ? "Replace with a new signed form (PDF)" : "Upload the signed form (PDF)"}
        </label>
        <Input id="consent-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button
          type="button"
          disabled={!file || upload.isPending}
          onClick={() =>
            file && upload.mutate({ topperId: topper.id, file }, { onSuccess: () => toast.success("Consent uploaded."), onError })
          }
        >
          {upload.isPending ? "Uploading…" : "Upload consent"}
        </Button>
      </div>
    </section>
  );
}
