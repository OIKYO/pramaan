import { FileUp } from "lucide-react";
import { useId, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

interface FileDropProps {
  accept: string;
  title: string;
  hint: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}

/** Drop a file here, or choose one. For CSVs and PDFs; posters use ImagePicker (with a preview). */
export function FileDrop({ accept, title, hint, onFile, disabled = false }: FileDropProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  };
  return (
    <>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-8 text-center transition-colors duration-(--duration-fast) hover:border-ink",
          dragging && "border-accent bg-accent-soft",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <FileUp className="size-5 text-muted-text" aria-hidden />
        <span className="font-medium text-ink-strong">{title}</span>
        <span className="max-w-sm text-xs text-pretty text-muted-text">{hint}</span>
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
