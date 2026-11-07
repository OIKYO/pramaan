import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { NewPosterInput } from "@/api/hooks/usePoster";
import type { Channel } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_LABEL } from "@/lib/labels";
import { TopperTagger } from "./TopperTagger";

interface PosterFormProps {
  /** "new" asks for a title and channel too; "version" keeps the poster's. */
  mode: "new" | "version";
  channel?: Channel;
  defaults?: { caption: string; alt_text: string; tagged_topper_ids: string[] };
  pending: boolean;
  onSubmit: (values: NewPosterInput) => void;
}

/** Image, caption, alt text, channel and the students shown, then "Run checks". */
export function PosterForm({ mode, channel: fixedChannel, defaults, pending, onSubmit }: PosterFormProps) {
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<Channel>(fixedChannel ?? "instagram");
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState(defaults?.caption ?? "");
  const [altText, setAltText] = useState(defaults?.alt_text ?? "");
  const [tags, setTags] = useState<string[]>(defaults?.tagged_topper_ids ?? []);
  const [tried, setTried] = useState(false);
  const titleMissing = mode === "new" && !title.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (!image || titleMissing) return;
    onSubmit({ title: title.trim(), channel, image, caption, alt_text: altText, tagged_topper_ids: tags });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {mode === "new" && (
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Poster title" error={tried && titleMissing ? "Give the poster a title reviewers will recognise." : null}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. JEE Main 2026 toppers" />
          </Field>
          <Field label="Where it will be published">
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}
      <ImagePicker file={image} onChange={setImage} error={tried && !image ? "Choose the poster image." : null} />
      <Field label="Caption" hint="The text posted with the image. It's checked too.">
        <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} maxLength={2200} />
      </Field>
      <Field
        label="Alt text"
        hint={channel === "print" ? "Optional for print." : "Needed on Instagram and WhatsApp: describe who is shown, the message and the contact details."}
      >
        <Textarea value={altText} onChange={(e) => setAltText(e.target.value)} rows={2} maxLength={1000} />
      </Field>
      <TopperTagger value={tags} onChange={setTags} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Running checks…" : "Run checks"}
        </Button>
        {pending && (
          <p className="text-sm text-muted-text" role="status">
            Reading the poster and running all 17 checks. This can take up to half a minute.
          </p>
        )}
      </div>
    </form>
  );
}
