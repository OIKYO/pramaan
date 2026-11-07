import { ImageUp } from "lucide-react";
import { useEffect, useId, useMemo, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 15 * 1024 * 1024;
const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface ImagePickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
}

/** Drop or choose the poster image, with a full preview. Checks the type and size before upload. */
export function ImagePicker({ file, onChange, error }: ImagePickerProps) {
  const id = useId();
  const [rejected, setRejected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const take = (picked: File | undefined) => {
    if (!picked) return;
    if (!ACCEPT.includes(picked.type)) return setRejected("That isn't a PNG, JPEG or WebP image. Export the poster in one of those.");
    if (picked.size > MAX_BYTES) return setRejected("That image is larger than 15 MB. Export it smaller and try again.");
    setRejected(null);
    onChange(picked);
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    take(event.dataTransfer.files[0]);
  };

  const message = rejected ?? error;
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
          dragging && "border-action bg-action/5",
          message && "border-blocked",
        )}
      >
        {preview && file ? (
          <>
            <img src={preview} alt="Preview of the poster" className="max-h-112 w-auto max-w-full rounded-sm border border-line object-contain" />
            <span className="text-sm text-muted-text">
              {file.name} · {megabytes(file.size)} · <span className="font-semibold text-ink-strong underline underline-offset-4">Replace</span>
            </span>
          </>
        ) : (
          <>
            <span className="grid size-12 place-items-center rounded-md bg-surface-sunken text-ink">
              <ImageUp className="size-6" aria-hidden />
            </span>
            <span className="font-semibold text-ink-strong">Drop the poster here, or choose a file</span>
            <span className="max-w-xs text-sm text-pretty text-muted-text">
              PNG, JPEG or WebP, up to 15 MB. Export at full size so the small print can be read.
            </span>
          </>
        )}
      </label>
      <input id={id} type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => take(e.target.files?.[0])} />
      {message && (
        <p role="alert" className="text-sm text-blocked">
          {message}
        </p>
      )}
    </div>
  );
}
