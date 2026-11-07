import { useState, type FormEvent } from "react";
import { useKeeps, useVocabulary } from "@/api/hooks/useCatalog";
import { useDeleteCourse, useSaveCourse } from "@/api/hooks/useRulebook";
import type { Course, CourseType } from "@/api/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { capitalise } from "@/lib/labels";
import { dateOrNull, joinList, splitList } from "@/lib/lists";
import { FormFooter } from "./FormFooter";

const TYPES: Record<CourseType, string> = { classroom: "Classroom", crash: "Crash course", test_series: "Test series", online: "Online" };

/** Add or edit something the organisation offers. FACT-01, FACT-02 and CCPA-05 check posters
 * against these. A type (classroom, crash...) is asked only of education; a duration where the
 * industry uses one or the exam results rulebook needs it. */
export function CourseForm({ course, onDone }: { course: Course | null; onDone: () => void }) {
  const save = useSaveCourse();
  const remove = useDeleteCourse();
  const words = useVocabulary();
  const keeps = useKeeps();
  const askType = words.offering_types;
  const askDuration = words.durations || keeps("rankings") || Boolean(course?.duration_label);
  const [form, setForm] = useState({
    name: course?.name ?? "", aliases: joinList(course?.aliases), course_type: course?.course_type ?? ("classroom" as CourseType),
    duration_label: course?.duration_label ?? "", duration_months: String(course?.duration_months ?? ""),
    is_paid: course?.is_paid ?? true, fee_inr: String(course?.fee_inr ?? ""), valid_until: course?.valid_until ?? "", source: course?.source ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const onError = (e: Error) => toast.error(`That change wasn't saved: ${e.message}`);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(
      {
        id: course?.id, name: form.name.trim(), aliases: splitList(form.aliases), course_type: askType ? form.course_type : null,
        duration_label: form.duration_label.trim() || null, duration_months: form.duration_months ? Number(form.duration_months) : null,
        is_paid: form.is_paid, fee_inr: form.is_paid ? Number(form.fee_inr) : 0, valid_until: dateOrNull(form.valid_until), source: form.source.trim(),
      },
      { onSuccess: () => toast.success(`${capitalise(words.offering)} saved.`), onError },
    );
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Name"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
      <Field label="Other names on posters" hint="Separated by commas. Used to recognise it on posters.">
        <Input value={form.aliases} onChange={(e) => set({ aliases: e.target.value })} />
      </Field>
      {askType && (
        <Field label="Type">
          <Select value={form.course_type ?? "classroom"} onValueChange={(v) => set({ course_type: v as CourseType })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
      {askDuration && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration as written" hint="e.g. 2 years"><Input value={form.duration_label} onChange={(e) => set({ duration_label: e.target.value })} required={keeps("rankings")} /></Field>
          <Field label="Duration in months"><Input type="number" min={1} value={form.duration_months} onChange={(e) => set({ duration_months: e.target.value })} required={Boolean(form.duration_label.trim())} /></Field>
        </div>
      )}
      <label className="flex items-center gap-3 text-sm"><Switch checked={form.is_paid} onCheckedChange={(on) => set({ is_paid: on })} /> Paid, not free</label>
      {form.is_paid && <Field label={`${capitalise(words.price)} (₹)`}><Input type="number" min={0} value={form.fee_inr} onChange={(e) => set({ fee_inr: e.target.value })} required /></Field>}
      <Field label="Approved until" hint="After this date, FACT-04 warns that the fact has expired."><Input type="date" value={form.valid_until} onChange={(e) => set({ valid_until: e.target.value })} /></Field>
      <Field label="Source"><Input value={form.source} onChange={(e) => set({ source: e.target.value })} /></Field>
      <FormFooter
        pending={save.isPending || remove.isPending}
        onCancel={onDone}
        onDelete={course ? () => { remove.mutate(course.id, { onSuccess: () => toast.success(`${capitalise(words.offering)} deleted.`), onError }); onDone(); } : undefined}
      />
    </form>
  );
}
