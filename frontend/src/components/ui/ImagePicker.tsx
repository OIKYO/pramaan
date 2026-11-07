import { ImageUp } from "lucide-react";
import { useEffect, useId, useState } from "react";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 15 * 1024 * 1024;

interface ImagePickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
}

/** Pick a poster image, with a preview. Checks type and size before upload. */
export function ImagePicker({ file, onChange, error }: ImagePickerProps) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const take = (picked: File | undefined) => {
    if (!picked) return;
    if (!ACCEPT.includes(picked.type)) return setRejected("Use a PNG, JPEG or WebP image.");
    if (picked.size > MAX_BYTES) return setRejected("That image is larger than 15 MB. Export it smaller.");
    setRejected(null);
    onChange(picked);
  };

  const message = rejected ?? error;
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line bg-surface p-6 text-center hover:border-ink"
      >
        {preview ? (
          <img src={preview} alt="Preview of the poster" className="max-h-72 rounded border border-line" />
        ) : (
          <ImageUp className="size-8 text-muted-text" aria-hidden />
        )}
        <span className="font-medium text-ink">{file ? file.name : "Choose the poster image"}</span>
        <span className="text-sm text-muted-text">PNG, JPEG or WebP, up to 15 MB. Export at full size.</span>
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
