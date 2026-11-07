import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAcceptInvite, useInvitePreview } from "@/api/hooks/useJoin";
import { useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState, LoadingRows } from "@/components/ui/States";
import { ROLE_LABEL, formatDate } from "@/lib/labels";
import { passwordNeeds } from "@/lib/password";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Someone opened an invite link: say who invited them to what, and make their account. */
export function InviteAccept({ token }: { token: string }) {
  const preview = useInvitePreview(token);
  const accept = useAcceptInvite(token);
  const { status, profile, signOut } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  if (preview.isPending) return <LoadingRows rows={4} />;
  if (preview.isError) return <ErrorState error={preview.error} />;
  const invite = preview.data;
  const email = invite.email ?? form.email;
  const where = invite.branch ? ` at ${invite.branch}` : invite.region ? ` for the ${invite.region} region` : "";
  if (status === "signed_in" && profile) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl">You're signed in as {profile.full_name}</h1>
        <p className="text-muted-text">This invite makes a new account in {invite.organisation}. Sign out first to accept it.</p>
        <Button onClick={() => void signOut()} className="self-start">Sign out</Button>
      </div>
    );
  }
  const errors = {
    full_name: form.full_name.trim().length < 2 ? "Enter your name." : null,
    email: !EMAIL.test(email.trim()) ? "Enter your work email." : null,
    password: passwordNeeds(form.password),
  };
  const show = (field: keyof typeof errors) => (tried ? errors[field] : null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    accept.mutate({ ...form, email: email.trim().toLowerCase() }, { onSuccess: () => navigate("/", { replace: true }) });
  };
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl">Join {invite.organisation}</h1>
        <p className="text-muted-text">
          {invite.invited_by ?? "Your organisation"} invited you as {ROLE_LABEL[invite.role].toLowerCase()}{where}. The invite
          works once, until {formatDate(invite.expires_at)}.
        </p>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Your name" error={show("full_name")}>
          <Input autoComplete="name" value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} />
        </Field>
        <Field label="Work email" hint={invite.email ? "The invite is for this email." : undefined} error={show("email")}>
          <Input type="email" autoComplete="email" value={email} readOnly={Boolean(invite.email)}
            onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <PasswordInput label="Password" value={form.password} onChange={(password) => set({ password })} insist={tried} />
        {accept.isError && <p role="alert" className="text-sm text-blocked">{accept.error.message}</p>}
        <Button type="submit" disabled={accept.isPending}>
          {accept.isPending && <Spinner />}
          Join {invite.organisation}
        </Button>
      </form>
    </div>
  );
}
