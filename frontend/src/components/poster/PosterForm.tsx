import { useState, type FormEvent } from "react";
import type { NewPosterInput } from "@/api/hooks/usePoster";
import type { Channel } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_LABEL } from "@/lib/labels";
import { TopperTagger } from "./TopperTagger";
import { UploadProgress } from "./UploadProgress";

interface PosterFormProps {
  /** "new" asks for a title and channel too; "version" keeps the poster's. */
  mode: "new" | "version";
  channel?: Channel;
  defaults?: { caption: string; alt_text: string; tagged_topper_ids: string[] };
  pending: boolean;
  onSubmit: (values: NewPosterInput) => void;
}

const CHANNELS = (Object.keys(CHANNEL_LABEL) as Channel[]).map((value) => ({ value, label: CHANNEL_LABEL[value] }));

/** The image beside its details (caption, alt text, channel, students shown), then "Run checks".
 * Side by side when there's room, stacked in a narrow drawer or on a phone. */
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
    <form onSubmit={submit} noValidate className="@container">
      <fieldset disabled={pending} className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <ImagePicker file={image} onChange={setImage} error={tried && !image ? "Choose the poster image first." : null} />
        <div className="flex min-w-0 flex-col gap-5">
          {mode === "new" && (
            <>
              <Field label="Poster title" error={tried && titleMissing ? "Give the poster a title reviewers will recognise." : null}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. JEE Main 2026 toppers" />
              </Field>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink-strong">Where it will be published</span>
                <SegmentedControl label="Where it will be published" value={channel} onChange={setChannel} options={CHANNELS} />
              </div>
            </>
          )}
          <Field label="Caption" hint="The text posted with the image. It's checked too.">
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} maxLength={2200} />
          </Field>
          <Field
            label="Alt text"
            hint={channel === "print" ? "Optional for print." : "Needed on Instagram and WhatsApp: who is shown, the message, and the contact details."}
          >
            <Textarea value={altText} onChange={(e) => setAltText(e.target.value)} rows={2} maxLength={1000} />
          </Field>
          <TopperTagger value={tags} onChange={setTags} />
          {pending ? (
            <UploadProgress canLeave={mode === "new"} />
          ) : (
            <div>
              <Button type="submit" size="lg">
                Run checks
              </Button>
            </div>
          )}
        </div>
      </fieldset>
    </form>
  );
}
