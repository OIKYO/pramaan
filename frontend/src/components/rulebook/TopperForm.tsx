import { useState, type FormEvent } from "react";
import { useCourses, useSaveTopper } from "@/api/hooks/useRulebook";
import type { Channel, Topper } from "@/api/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { CHANNEL_LABEL } from "@/lib/labels";
import { dateOrNull, joinList, splitList } from "@/lib/lists";
import { FormFooter } from "./FormFooter";

/** Edit a topper's result and consent details. CCPA-02 to CCPA-05 check posters against these. */
export function TopperForm({ topper, onDone }: { topper: Topper | null; onDone: () => void }) {
  const save = useSaveTopper();
  const courses = useCourses();
  const [f, setF] = useState({
    full_name: topper?.full_name ?? "", name_variants: joinList(topper?.name_variants), exam: topper?.exam ?? "JEE Main",
    exam_year: String(topper?.exam_year ?? 2026), rank: String(topper?.rank ?? ""), result_date: topper?.result_date ?? "",
    course_id: topper?.course_id ?? "", is_minor: topper?.is_minor ?? false, guardian_signed: topper?.guardian_signed ?? false,
    consent_date: topper?.consent_date ?? "", consent_valid_until: topper?.consent_valid_until ?? "",
    consent_channels: topper?.consent_channels ?? ([] as Channel[]),
  });
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch });
  const toggleChannel = (c: Channel, on: boolean) =>
    set({ consent_channels: on ? [...f.consent_channels, c] : f.consent_channels.filter((x) => x !== c) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(
      {
        id: topper?.id, full_name: f.full_name.trim(), name_variants: splitList(f.name_variants), exam: f.exam.trim(),
        exam_year: Number(f.exam_year), rank: Number(f.rank), result_date: f.result_date, course_id: f.course_id || null,
        is_minor: f.is_minor, guardian_signed: f.guardian_signed, consent_date: dateOrNull(f.consent_date),
        consent_valid_until: dateOrNull(f.consent_valid_until), consent_channels: f.consent_channels,
      },
      { onSuccess: () => toast.success("Topper saved."), onError: (e) => toast.error(`The topper wasn't saved: ${e.message}`) },
    );
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Full name"><Input value={f.full_name} onChange={(e) => set({ full_name: e.target.value })} required /></Field>
      <Field label="Other spellings" hint="Separated by commas. Used to match names on posters.">
        <Input value={f.name_variants} onChange={(e) => set({ name_variants: e.target.value })} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Exam"><Input value={f.exam} onChange={(e) => set({ exam: e.target.value })} required /></Field>
        <Field label="Year"><Input type="number" value={f.exam_year} onChange={(e) => set({ exam_year: e.target.value })} required /></Field>
        <Field label="Rank (AIR)"><Input type="number" min={1} value={f.rank} onChange={(e) => set({ rank: e.target.value })} required /></Field>
      </div>
      <Field label="Result date"><Input type="date" value={f.result_date} onChange={(e) => set({ result_date: e.target.value })} required /></Field>
      <Field label="Course taken">
        <Select value={f.course_id} onValueChange={(v) => set({ course_id: v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Choose the course" /></SelectTrigger>
          <SelectContent>{(courses.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-3 text-sm"><Switch checked={f.is_minor} onCheckedChange={(on) => set({ is_minor: on })} /> Under 18</label>
      {f.is_minor && (
        <label className="flex items-center gap-3 text-sm"><Switch checked={f.guardian_signed} onCheckedChange={(on) => set({ guardian_signed: on })} /> Parent or guardian signed the consent</label>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Consent signed on" hint="Must be after the result date."><Input type="date" value={f.consent_date} onChange={(e) => set({ consent_date: e.target.value })} /></Field>
        <Field label="Consent valid until"><Input type="date" value={f.consent_valid_until} onChange={(e) => set({ consent_valid_until: e.target.value })} /></Field>
      </div>
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="mb-2 font-medium">Consent covers</legend>
        {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
          <label key={c} className="flex items-center gap-2">
            <Checkbox checked={f.consent_channels.includes(c)} onCheckedChange={(on) => toggleChannel(c, on === true)} /> {CHANNEL_LABEL[c]}
          </label>
        ))}
      </fieldset>
      <FormFooter pending={save.isPending} onCancel={onDone} />
    </form>
  );
}
