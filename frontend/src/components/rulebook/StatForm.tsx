import { useState, type FormEvent } from "react";
import { useVocabulary } from "@/api/hooks/useCatalog";
import { useDeleteResultStat, useSaveResultStat } from "@/api/hooks/useRulebook";
import type { ResultStat } from "@/api/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";
import { dateOrNull } from "@/lib/lists";
import { FormFooter } from "./FormFooter";

export function StatForm({ stat, onDone }: { stat: ResultStat | null; onDone: () => void }) {
  const save = useSaveResultStat();
  const remove = useDeleteResultStat();
  const askExam = useVocabulary().exams || Boolean(stat?.exam);
  const [form, setForm] = useState({
    label: stat?.label ?? "", value: String(stat?.value ?? ""), exam: stat?.exam ?? "",
    year: String(stat?.year ?? new Date().getFullYear()), valid_until: stat?.valid_until ?? "", source: stat?.source ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const onError = (e: Error) => toast.error(`That change wasn't saved: ${e.message}`);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(
      { id: stat?.id, label: form.label.trim(), value: Number(form.value), exam: form.exam.trim() || null, year: form.year ? Number(form.year) : null,
        valid_until: dateOrNull(form.valid_until), source: form.source.trim() },
      { onSuccess: () => toast.success("Figure saved."), onError },
    );
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="What it counts" hint="Written the way posters say it.">
        <Input value={form.label} onChange={(e) => set({ label: e.target.value })} required />
      </Field>
      <div className={askExam ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4"}>
        <Field label="Figure"><Input type="number" value={form.value} onChange={(e) => set({ value: e.target.value })} required /></Field>
        {askExam && <Field label="Exam"><Input value={form.exam} onChange={(e) => set({ exam: e.target.value })} /></Field>}
        <Field label="Year"><Input type="number" value={form.year} onChange={(e) => set({ year: e.target.value })} /></Field>
      </div>
      <Field label="Approved until"><Input type="date" value={form.valid_until} onChange={(e) => set({ valid_until: e.target.value })} /></Field>
      <Field label="Source" hint="Where the figure can be verified."><Input value={form.source} onChange={(e) => set({ source: e.target.value })} /></Field>
      <FormFooter
        pending={save.isPending || remove.isPending}
        onCancel={onDone}
        onDelete={stat ? () => { remove.mutate(stat.id, { onSuccess: () => toast.success("Figure deleted."), onError }); onDone(); } : undefined}
      />
    </form>
  );
}
