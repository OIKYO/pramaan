import { ImageOff, Upload } from "lucide-react";
import { useId } from "react";
import { logoUrl, useUploadLogo } from "@/api/hooks/useRulebook";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function LogoField({ orgId, path, canEdit }: { orgId: string; path: string | null; canEdit: boolean }) {
  const upload = useUploadLogo();
  const id = useId();
  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error("Use a PNG, JPEG, WebP or SVG logo.");
    if (file.size > 2 * 1024 * 1024) return toast.error("The logo is larger than 2 MB. Export it smaller.");
    upload.mutate({ orgId, file }, { onSuccess: () => toast.success("Logo updated."), onError: (e) => toast.error(e.message) });
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-strong">Logo</span>
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface-sunken">
          {path ? <img src={logoUrl(path)} alt="Current logo" className="max-h-full max-w-full object-contain p-1.5" /> : <ImageOff className="size-5 text-muted-text" aria-hidden />}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-pretty text-muted-text">Posters are checked for this exact logo. Upload the master file, not a screenshot.</p>
          {canEdit && (
            <>
              <label htmlFor={id} className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink-strong hover:bg-surface-sunken">
                {upload.isPending ? <Spinner /> : <Upload className="size-4" aria-hidden />}
                {path ? "Replace logo" : "Upload logo"}
              </label>
              <input id={id} type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
