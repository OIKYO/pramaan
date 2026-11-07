import { Building2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCodePreview, useJoinWithCode } from "@/api/hooks/useJoin";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { passwordNeeds } from "@/lib/password";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** "k7mq x3vp" as it's typed -> "K7MQ-X3VP". */
const formatCode = (raw: string) => {
  const text = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return text.length > 4 ? `${text.slice(0, 4)}-${text.slice(4)}` : text;
};

/** Join an existing organisation with the code a colleague gave you. You join as branch staff of the
 * branch you pick; head office can change your role later. */
export function JoinForm() {
  const join = useJoinWithCode();
  const [code, setCode] = useState("");
  const preview = useCodePreview(code);
  const [form, setForm] = useState({ branch_id: "", full_name: "", email: "", password: "" });
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const errors = {
    code: !preview.data ? "Enter the 8-character code from your organisation." : null,
    branch_id: !form.branch_id ? "Choose your branch." : null,
    full_name: form.full_name.trim().length < 2 ? "Enter your name." : null,
    email: !EMAIL.test(form.email.trim()) ? "Enter your work email." : null,
    password: passwordNeeds(form.password),
  };
  const show = (field: keyof typeof errors) => (tried ? errors[field] : null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    join.mutate({ code, ...form, email: form.email.trim().toLowerCase(), full_name: form.full_name.trim() });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl">Join your organisation</h2>
        <p className="text-muted-text">Ask your manager or head office for your organisation's code. It's only visible inside the organisation.</p>
      </div>
      <Field
        label="Organisation code"
        error={code.length === 9 && preview.isError ? "No organisation has that code. Check it with your manager." : show("code")}
      >
        <Input
          value={code}
          onChange={(e) => setCode(formatCode(e.target.value))}
          placeholder="ABCD-1234"
          autoComplete="off"
          spellCheck={false}
          className="tracking-widest uppercase"
        />
      </Field>
      {preview.isFetching && <p className="flex items-center gap-2 text-sm text-muted-text"><Spinner /> Looking up the code…</p>}
      {preview.data && (
        <>
          <p className="flex items-center gap-2 rounded-md border border-line bg-surface-sunken px-3 py-2 text-sm text-ink-strong">
            <Building2 className="size-4 text-muted-text" aria-hidden /> {preview.data.organisation}
          </p>
          <Field label="Your branch" error={show("branch_id")}>
            <Select value={form.branch_id || undefined} onValueChange={(branch_id) => set({ branch_id })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose your branch" /></SelectTrigger>
              <SelectContent>
                {preview.data.branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} · {b.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
      <Field label="Your name" error={show("full_name")}>
        <Input autoComplete="name" value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} />
      </Field>
      <Field label="Work email" error={show("email")}>
        <Input type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
      </Field>
      <PasswordInput label="Password" value={form.password} onChange={(password) => set({ password })} insist={tried} />
      {join.isError && <p role="alert" className="text-sm text-blocked">{join.error.message}</p>}
      <Button type="submit" disabled={join.isPending}>
        {join.isPending && <Spinner />}
        Join organisation
      </Button>
    </form>
  );
}
