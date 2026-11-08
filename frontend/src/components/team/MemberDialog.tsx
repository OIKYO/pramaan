import { useState, type FormEvent } from "react";
import type { MemberInput } from "@/api/hooks/useTeam";
import type { Branch, Profile, Region, Role } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextLink } from "@/components/ui/TextLink";
import { Spinner } from "@/components/ui/Spinner";
import { ROLE_LABEL } from "@/lib/labels";

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Profile | null;
  branches: Branch[];
  regions: Region[];
  pending: boolean;
  onSubmit: (input: MemberInput) => void;
}

const ROLES = (Object.keys(ROLE_LABEL) as Role[]).map((value) => ({ value, label: ROLE_LABEL[value] }));

export function MemberDialog({ open, onOpenChange, member, branches, regions, pending, onSubmit }: MemberDialogProps) {
  const [form, setForm] = useState<MemberInput>({
    full_name: member?.full_name ?? "", email: member?.email ?? "", role: member?.role ?? "branch_staff",
    branch_id: member?.branch_id ?? null, region_id: member?.region_id ?? null,
  });
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<MemberInput>) => setForm({ ...form, ...patch });
  const errors = {
    full_name: form.full_name.trim().length < 2 ? "Enter their name." : null,
    email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) ? "Enter their work email." : null,
    branch: form.role === "branch_staff" && !form.branch_id ? "Choose their branch." : null,
    region: form.role === "regional_manager" && !form.region_id ? "Choose their region." : null,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    onSubmit({ ...form, full_name: form.full_name.trim(), email: form.email.trim().toLowerCase() });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={member ? `Edit ${member.full_name}` : "Add a person"}
      description={member ? undefined : "They get a temporary password to sign in with, and choose their own the first time."}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Name" error={tried ? errors.full_name : null}>
          <Input value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} autoComplete="off" />
        </Field>
        {!member && (
          <Field label="Work email" error={tried ? errors.email : null}>
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="off" />
          </Field>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-strong">Role</span>
          <SegmentedControl label="Role" value={form.role} onChange={(role) => set({ role })} options={ROLES} />
        </div>
        {form.role === "branch_staff" && (
          <Field label="Branch" error={tried ? errors.branch : null} hint={branches.length === 0 ? "Add a branch first, on the Branches page." : undefined}>
            <Select value={form.branch_id ?? ""} onValueChange={(v) => set({ branch_id: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a branch" /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        )}
        {form.role === "regional_manager" && (
          <Field label="Region" error={tried ? errors.region : null} hint={regions.length === 0 ? <>Add a region first, on the <TextLink to="/organisation/regions">Regions</TextLink> page.</> : undefined}>
            <Select value={form.region_id ?? ""} onValueChange={(v) => set({ region_id: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a region" /></SelectTrigger>
              <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {member ? "Save changes" : "Add person"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
