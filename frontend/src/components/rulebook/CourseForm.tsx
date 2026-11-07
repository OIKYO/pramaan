import { useState, type FormEvent } from "react";
import { useDeleteCourse, useSaveCourse } from "@/api/hooks/useRulebook";
import type { Course, CourseType } from "@/api/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { dateOrNull, joinList, splitList } from "@/lib/lists";
import { FormFooter } from "./FormFooter";

const TYPES: Record<CourseType, string> = { classroom: "Classroom", crash: "Crash course", test_series: "Test series", online: "Online" };

/** Add or edit an approved course. FACT-01, FACT-02 and CCPA-05 check posters against these. */
export function CourseForm({ course, onDone }: { course: Course | null; onDone: () => void }) {
  const save = useSaveCourse();
  const remove = useDeleteCourse();
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
        id: course?.id, name: form.name.trim(), aliases: splitList(form.aliases), course_type: form.course_type,
        duration_label: form.duration_label.trim(), duration_months: Number(form.duration_months),
        is_paid: form.is_paid, fee_inr: form.is_paid ? Number(form.fee_inr) : 0, valid_until: dateOrNull(form.valid_until), source: form.source.trim(),
      },
      { onSuccess: () => toast.success("Course saved."), onError },
    );
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Name"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
      <Field label="Other names on posters" hint="Separated by commas, e.g. crash course, 1-year crash">
        <Input value={form.aliases} onChange={(e) => set({ aliases: e.target.value })} />
      </Field>
      <Field label="Type">
        <Select value={form.course_type} onValueChange={(v) => set({ course_type: v as CourseType })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration as written" hint="e.g. 2 years"><Input value={form.duration_label} onChange={(e) => set({ duration_label: e.target.value })} required /></Field>
        <Field label="Duration in months"><Input type="number" min={1} value={form.duration_months} onChange={(e) => set({ duration_months: e.target.value })} required /></Field>
      </div>
      <label className="flex items-center gap-3 text-sm"><Switch checked={form.is_paid} onCheckedChange={(on) => set({ is_paid: on })} /> Paid course</label>
      {form.is_paid && <Field label="Fee (₹)"><Input type="number" min={0} value={form.fee_inr} onChange={(e) => set({ fee_inr: e.target.value })} required /></Field>}
      <Field label="Approved until" hint="After this date, FACT-04 warns that the fact has expired."><Input type="date" value={form.valid_until} onChange={(e) => set({ valid_until: e.target.value })} /></Field>
      <Field label="Source"><Input value={form.source} onChange={(e) => set({ source: e.target.value })} /></Field>
      <FormFooter
        pending={save.isPending || remove.isPending}
        onCancel={onDone}
        onDelete={course ? () => { remove.mutate(course.id, { onSuccess: () => toast.success("Course deleted."), onError }); onDone(); } : undefined}
      />
    </form>
  );
}
