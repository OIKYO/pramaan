import { FileText, ImageUp } from "lucide-react";
import { useEffect, useId, useMemo, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

const IMAGES = ["image/png", "image/jpeg", "image/webp"];
const PDF = "application/pdf";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_IMAGES = 10;
const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface ImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string | null;
}

function problemWith(picked: File[]): string | null {
  const pdfs = picked.filter((f) => f.type === PDF);
  if (pdfs.length > 0) {
    if (picked.length > 1) return "Upload one PDF on its own, or images only.";
    return pdfs[0].size > MAX_PDF_BYTES ? "That PDF is larger than 25 MB. Export it smaller and try again." : null;
  }
  if (picked.some((f) => !IMAGES.includes(f.type))) return "Use PNG, JPEG or WebP images, or one PDF.";
  if (picked.length > MAX_IMAGES) return `A post can have up to ${MAX_IMAGES} images. Split it into two posts.`;
  if (picked.some((f) => f.size > MAX_IMAGE_BYTES)) return "An image is larger than 15 MB. Export it smaller and try again.";
  return null;
}

export function ImagePicker({ files, onChange, error }: ImagePickerProps) {
  const id = useId();
  const [rejected, setRejected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const isPdf = files[0]?.type === PDF;
  const previews = useMemo(() => (isPdf ? [] : files.map((f) => URL.createObjectURL(f))), [files, isPdf]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const take = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    const problem = problemWith(picked);
    setRejected(problem);
    if (!problem) onChange(picked);
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    take(event.dataTransfer.files);
  };

  const message = rejected ?? error;
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={cn(
          "flex min-h-72 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line-strong bg-surface p-5 text-center transition-colors duration-(--duration-fast) hover:border-ink",
          dragging && "border-accent bg-accent/5",
          message && "border-blocked",
        )}
      >
        {files.length > 0 ? (
          <>
            {isPdf ? (
              <span className="flex flex-col items-center gap-2 py-8">
                <FileText className="size-10 text-muted-text" aria-hidden />
                <span className="text-sm text-ink">Each page of the brochure is read and checked.</span>
              </span>
            ) : (
              <img src={previews[0]} alt="Preview of the poster" className="max-h-112 w-auto max-w-full rounded-sm border border-line object-contain" />
            )}
            {previews.length > 1 && (
              <span className="flex flex-wrap justify-center gap-2">
                {previews.map((url, i) => (
                  <img key={url} src={url} alt={`Page ${i + 1}`} className="h-16 w-auto rounded-xs border border-line object-cover" />
                ))}
              </span>
            )}
            <span className="text-sm text-muted-text">
              {files.length > 1 ? `${files.length} images, a carousel` : files[0].name} · {megabytes(total)} ·{" "}
              <span className="font-semibold text-ink-strong underline underline-offset-4">Replace</span>
            </span>
          </>
        ) : (
          <>
            <span className="grid size-12 place-items-center rounded-md bg-surface-sunken text-ink">
              <ImageUp className="size-6" aria-hidden />
            </span>
            <span className="font-semibold text-ink-strong">Drop the poster here, or choose files</span>
            <span className="max-w-xs text-sm text-pretty text-muted-text">
              One image, up to 10 for a carousel, or a PDF brochure of up to 10 pages. PNG, JPEG or WebP up to 15 MB each; PDFs up to 25 MB.
            </span>
          </>
        )}
      </label>
      <input id={id} type="file" multiple accept={[...IMAGES, PDF].join(",")} className="sr-only" onChange={(e) => take(e.target.files)} />
      {message && (
        <p role="alert" className="text-sm text-blocked">
          {message}
        </p>
      )}
    </div>
  );
}
