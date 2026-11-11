import { FileLock2, Link2 } from "lucide-react";
import { useState } from "react";
import { useConsentFile, useUploadConsent } from "@/api/hooks/useRulebook";
import type { Topper } from "@/api/types";
import { ConsentBadge } from "@/components/consent/ConsentBadge";
import { ConsentLinkDialog } from "@/components/consent/ConsentLinkDialog";
import { ConsentRequestList } from "@/components/consent/ConsentRequestList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";

export function ConsentPanel({ topper }: { topper: Topper }) {
  const upload = useUploadConsent();
  const onFile = topper.has_consent && topper.consent_source === "file";
  const fileUrl = useConsentFile(topper.id, onFile);
  const [file, setFile] = useState<File | null>(null);
  const [asking, setAsking] = useState(false);
  const onError = (e: Error) => toast.error(e.message);

  return (
    <section className="flex flex-col gap-3 rounded-md border border-line bg-surface-sunken/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm">
          <FileLock2 className="size-4 text-muted-text" aria-hidden /> Consent
        </h3>
        <ConsentBadge topper={topper} />
      </div>
      <p className="text-sm text-muted-text">Private to head office. Never sent to the AI.</p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink-strong">Ask by link</p>
        <p className="text-sm text-muted-text">
          {topper.full_name}{topper.is_minor ? "'s parent or guardian" : ""} sees what posters will say, then approves or declines, and can withdraw later.
        </p>
        <Button type="button" variant="secondary" className="self-start" onClick={() => setAsking(true)}>
          <Link2 /> Make a consent link
        </Button>
        <ConsentRequestList topperId={topper.id} />
      </div>

      {onFile && (
        <Button
          type="button"
          variant="secondary"
          disabled={!fileUrl.data}
          onClick={() => fileUrl.data && window.open(fileUrl.data, "_blank", "noopener,noreferrer")}
        >
          {fileUrl.isError ? "The consent file can't be opened right now" : "Open consent file"}
        </Button>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink-strong" htmlFor="consent-file">
          {topper.consent_source === "file" ? "Replace with a new signed form (PDF)" : "Or upload a signed form (PDF)"}
        </label>
        <Input id="consent-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button
          type="button"
          disabled={!file || upload.isPending}
          onClick={() => file && upload.mutate({ topperId: topper.id, file }, { onSuccess: () => toast.success("Consent uploaded."), onError })}
        >
          {upload.isPending ? "Uploading…" : "Upload consent"}
        </Button>
      </div>
      {asking && <ConsentLinkDialog open onOpenChange={setAsking} topperId={topper.id} personName={topper.full_name} />}
    </section>
  );
}
