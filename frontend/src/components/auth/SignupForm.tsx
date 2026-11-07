import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useSignup } from "@/api/hooks/useAccount";
import { useCatalog } from "@/api/hooks/useCatalog";
import { IndustryPicker, type IndustryValue } from "@/components/organisation/IndustryPicker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { LoadingRows } from "@/components/ui/States";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A new company signs up and says what it does. Whoever signs up becomes its head office; the
 * industry picks Pramaan's words and the rulebooks it starts with. */
export function SignupForm({ onCreated }: { onCreated: () => void }) {
  const signup = useSignup();
  const catalog = useCatalog();
  const [form, setForm] = useState({ organisation_name: "", full_name: "", email: "", password: "", org_type: "" });
  const [industry, setIndustry] = useState<IndustryValue>({ group: null, industry: null });
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const errors = {
    organisation_name: form.organisation_name.trim().length < 2 ? "Enter your organisation's name." : null,
    industry: !industry.group || !industry.industry ? "Choose what your organisation does, or type it." : null,
    org_type: !form.org_type ? "Choose what kind of organisation it is." : null,
    full_name: form.full_name.trim().length < 2 ? "Enter your name." : null,
    email: !EMAIL.test(form.email.trim()) ? "Enter a work email, like you@yourcompany.com." : null,
    password: form.password.length < 8 ? "Use at least 8 characters." : null,
  };
  const show = (field: keyof typeof errors) => (tried ? errors[field] : null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    signup.mutate(
      { ...form, email: form.email.trim().toLowerCase(), industry_group: industry.group, industry: industry.industry, focus: [] },
      { onSuccess: onCreated },
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl">Create your organisation</h1>
        <p className="text-muted-text">You'll be its head office. Pramaan sets up rulebooks to suit what you do; you can change them later.</p>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Organisation name" error={show("organisation_name")}>
          <Input autoComplete="organization" value={form.organisation_name} onChange={(e) => set({ organisation_name: e.target.value })} />
        </Field>
        <Field label="What it does" error={show("industry")}>
          {catalog.data ? (
            <IndustryPicker catalog={catalog.data} value={industry} onChange={setIndustry} invalid={Boolean(show("industry"))} />
          ) : catalog.isError ? (
            <p className="text-sm text-blocked">The list of industries couldn't load. Check your connection and reload the page.</p>
          ) : (
            <LoadingRows rows={1} />
          )}
        </Field>
        <Field label="Kind of organisation" error={show("org_type")}>
          <Select value={form.org_type || undefined} onValueChange={(v) => set({ org_type: v })}>
            <SelectTrigger className="w-full" aria-invalid={Boolean(show("org_type")) || undefined}><SelectValue placeholder="Choose one" /></SelectTrigger>
            <SelectContent>{(catalog.data?.org_types ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <hr className="my-2 border-line" />
        <Field label="Your name" error={show("full_name")}>
          <Input autoComplete="name" value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} />
        </Field>
        <Field label="Work email" error={show("email")}>
          <Input type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Password" hint="At least 8 characters." error={show("password")}>
          <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => set({ password: e.target.value })} />
        </Field>
        {signup.isError && (
          <p role="alert" className="text-sm text-blocked">
            {signup.error.message}
          </p>
        )}
        <Button type="submit" disabled={signup.isPending}>
          {signup.isPending && <Spinner />}
          Create organisation
        </Button>
        <p className="text-muted-text">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
