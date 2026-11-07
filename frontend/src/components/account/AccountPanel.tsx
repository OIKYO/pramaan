import { useState, type FormEvent } from "react";
import { useUpdateMyName } from "@/api/hooks/useAccount";
import type { Profile } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/Panel";
import { toast } from "@/components/ui/Toast";
import { ROLE_LABEL, formatDate } from "@/lib/labels";

/** Who you are in Pramaan. You can change your name; head office changes roles and branches. */
export function AccountPanel({ profile, where }: { profile: Profile; where: string }) {
  const update = useUpdateMyName();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.full_name);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error("Enter at least 2 characters.");
    update.mutate(name.trim(), {
      onSuccess: () => { toast.success("Name changed."); setEditing(false); },
      onError: (e) => toast.error(`Your name wasn't changed: ${e.message}`),
    });
  };
  return (
    <Panel
      title="Your account"
      actions={!editing && <Button variant="ghost" size="sm" onClick={() => { setName(profile.full_name); setEditing(true); }}>Edit</Button>}
    >
      {editing ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Name" hint="Shown on posters you upload and reviews you write.">
            <Input autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={update.isPending || name.trim() === profile.full_name}>Save</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-4">
          <Avatar name={profile.full_name} />
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted-text">Name</dt>
            <dd className="font-medium text-ink-strong">{profile.full_name}</dd>
            <dt className="text-muted-text">Email</dt>
            <dd className="break-all text-ink-strong">{profile.email}</dd>
            <dt className="text-muted-text">Role</dt>
            <dd className="text-ink-strong">{ROLE_LABEL[profile.role]}{where && ` · ${where}`}</dd>
            <dt className="text-muted-text">Member since</dt>
            <dd className="text-ink-strong">{formatDate(profile.created_at)}</dd>
          </dl>
        </div>
      )}
    </Panel>
  );
}
