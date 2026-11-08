import { Share2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCreateInvite } from "@/api/hooks/useInvites";
import { useBranches, useRegions } from "@/api/hooks/useOrganisation";
import { useProfile } from "@/api/hooks/useSession";
import type { InviteCreated, Role } from "@/api/types";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/CopyField";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { ROLE_LABEL, formatDate } from "@/lib/labels";

export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const me = useProfile();
  const create = useCreateInvite();
  const regional = me.role === "regional_manager";
  const branches = (useBranches().data ?? []).filter((b) => !regional || b.region_id === me.region_id);
  const regions = useRegions().data ?? [];
  const [form, setForm] = useState({ role: "branch_staff" as Role, branch_id: "", region_id: "", email: "" });
  const [made, setMade] = useState<InviteCreated | null>(null);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const link = made ? `${window.location.origin}/join/${made.token}` : "";
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setMade(null);
      create.reset();
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { role: form.role, branch_id: form.branch_id || null, region_id: form.region_id || null, email: form.email.trim() || null },
      { onSuccess: setMade },
    );
  };
  const share = () => void navigator.share?.({ title: "Join us on Pramaan", text: "Your invite to Pramaan:", url: link }).catch(() => undefined);

  return (
    <Modal open={open} onOpenChange={close} title={made ? "Invite link ready" : "Invite someone"}
      description={made ? `Send it to them. It works once, until ${formatDate(made.invite.expires_at)}, and isn't shown again.` : "They'll make their own account and join with this role."}>
      {made ? (
        <div className="flex flex-col gap-4">
          <CopyField label="Invite link" value={link} />
          <div className="flex justify-end gap-2">
            {"share" in navigator && <Button variant="secondary" onClick={share}><Share2 /> Share</Button>}
            <Button onClick={() => close(false)}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {!regional && (
            <Field label="Role">
              <Select value={form.role} onValueChange={(role) => set({ role: role as Role, branch_id: "", region_id: "" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          {form.role === "branch_staff" && (
            <Field label="Branch">
              <Select value={form.branch_id || undefined} onValueChange={(branch_id) => set({ branch_id })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Choose a branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          {form.role === "regional_manager" && (
            <Field label="Region">
              <Select value={form.region_id || undefined} onValueChange={(region_id) => set({ region_id })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Choose a region" /></SelectTrigger>
                <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Their email (optional)" hint="If you add it, only this email can use the link.">
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          {create.isError && <p role="alert" className="text-sm text-blocked">{create.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending && <Spinner />} Create link</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
