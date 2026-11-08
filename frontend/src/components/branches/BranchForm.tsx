import { useState, type FormEvent } from "react";
import { useDeleteBranch, useSaveBranch } from "@/api/hooks/useOrganisation";
import type { Branch, Region } from "@/api/types";
import { FormFooter } from "@/components/rulebook/FormFooter";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextLink } from "@/components/ui/TextLink";
import { toast } from "@/components/ui/Toast";

/** Add or edit a branch. Its phone and address are what FACT-03 expects on its posters. */
export function BranchForm({ branch, regions, onDone }: { branch: Branch | null; regions: Region[]; onDone: () => void }) {
  const save = useSaveBranch();
  const remove = useDeleteBranch();
  const [form, setForm] = useState({
    name: branch?.name ?? "", city: branch?.city ?? "", region_id: branch?.region_id ?? regions[0]?.id ?? "",
    phone: branch?.phone ?? "", address: branch?.address ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const onError = (e: Error) => toast.error(`That wasn't saved: ${e.message}`);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.region_id) return toast.error("Add a region first, then choose it here.");
    save.mutate({ id: branch?.id, ...form }, { onSuccess: () => { toast.success("Branch saved."); onDone(); }, onError });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Branch name"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
      <Field
        label="Region"
        hint={regions.length === 0
          ? <>Add a region first, on the <TextLink to="/organisation/regions">Regions</TextLink> page.</>
          : <>Need another one? Add it on the <TextLink to="/organisation/regions">Regions</TextLink> page.</>}
      >
        <Select value={form.region_id} onValueChange={(v) => set({ region_id: v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Choose a region" /></SelectTrigger>
          <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="City"><Input value={form.city} onChange={(e) => set({ city: e.target.value })} required /></Field>
      <Field label="Phone on posters" hint="The number this branch prints. FACT-03 checks it.">
        <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} required />
      </Field>
      <Field label="Address"><Input value={form.address} onChange={(e) => set({ address: e.target.value })} required /></Field>
      <FormFooter
        pending={save.isPending || remove.isPending}
        onCancel={onDone}
        onDelete={branch ? () => remove.mutate(branch.id, { onSuccess: () => { toast.success("Branch deleted."); onDone(); }, onError }) : undefined}
      />
    </form>
  );
}
