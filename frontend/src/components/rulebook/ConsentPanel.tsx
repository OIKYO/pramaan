import { FileLock2, Link2 } from "lucide-react";
import { useState } from "react";
import { useConsentLink, useUploadConsent } from "@/api/hooks/useRulebook";
import type { Topper } from "@/api/types";
import { ConsentBadge } from "@/components/consent/ConsentBadge";
import { ConsentLinkDialog } from "@/components/consent/ConsentLinkDialog";
import { ConsentRequestList } from "@/components/consent/ConsentRequestList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";

export function ConsentPanel({ topper }: { topper: Topper }) {
  const upload = useUploadConsent();
  const link = useConsentLink();
  const [file, setFile] = useState<File | null>(null);
  const [asking, setAsking] = useState(false);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const onError = (e: Error) => toast.error(e.message);
  const openFile = () => {
    // The tab opens during the click: opened only after the link arrives, browsers block it as a pop-up.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    setBlockedUrl(null);
    link.mutate(topper.id, {
      onSuccess: ({ url }) => (tab ? tab.location.replace(url) : setBlockedUrl(url)),
      onError: (e) => {
        tab?.close();
        onError(e);
      },
    });
  };

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

      {topper.has_consent && topper.consent_source === "file" && (
        <Button
          type="button"
          variant="secondary"
          disabled={link.isPending}
          onClick={openFile}
        >
          Open consent file
        </Button>
      )}
      {blockedUrl && (
        <p role="status" className="text-sm text-ink">
          Your browser blocked the new tab.{" "}
          <a href={blockedUrl} target="_blank" rel="noopener noreferrer" onClick={() => setBlockedUrl(null)}
            className="font-medium text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong">
            Open the consent file
          </a>{" "}
          (the link works for 2 minutes).
        </p>
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
