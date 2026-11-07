import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useCatalog } from "@/api/hooks/useCatalog";
import { useUpdateOrganisation } from "@/api/hooks/useOrganisation";
import type { Organisation } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { Field } from "@/components/ui/Field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingRows } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { IndustryPicker, type IndustryValue } from "./IndustryPicker";

/** What the organisation does. It picks the words Pramaan uses and suggests rulebooks; changing it
 * never switches a rulebook on or off by itself. Head office edits it; others see it. */
export function OrgProfileForm({ org, canEdit }: { org: Organisation; canEdit: boolean }) {
  const catalog = useCatalog().data;
  const update = useUpdateOrganisation();
  const [industry, setIndustry] = useState<IndustryValue>({ group: org.industry_group, industry: org.industry });
  const [orgType, setOrgType] = useState(org.org_type ?? "");
  const [focus, setFocus] = useState<string[]>(org.focus ?? []);
  if (!catalog) return <LoadingRows rows={3} />;

  const typeName = catalog.org_types.find((t) => t.id === org.org_type)?.name;
  if (!canEdit) {
    return (
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-sm">
        <dt className="text-muted-text">Industry</dt>
        <dd className="text-ink-strong">{org.industry ?? "Not set yet"}</dd>
        <dt className="text-muted-text">Kind</dt>
        <dd className="text-ink-strong">{typeName ?? "Not set yet"}</dd>
      </dl>
    );
  }

  const changed = industry.group !== org.industry_group || industry.industry !== org.industry
    || orgType !== (org.org_type ?? "") || focus.join() !== (org.focus ?? []).join();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!industry.group || !industry.industry) return toast.error("Choose the industry your organisation works in.");
    if (!orgType) return toast.error("Choose what kind of organisation it is.");
    update.mutate(
      { industry_group: industry.group, industry: industry.industry, org_type: orgType, focus },
      { onSuccess: () => toast.success("Saved. Pramaan now uses your industry's words."), onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Industry" hint="Search across 30 industries. If yours isn't listed, type it.">
        <IndustryPicker catalog={catalog} value={industry} onChange={setIndustry} />
      </Field>
      <Field label="Kind of organisation">
        <Select value={orgType || undefined} onValueChange={setOrgType}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Choose one" /></SelectTrigger>
          <SelectContent>{catalog.org_types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="What you'll check posters for" hint="Optional. It helps suggest rulebooks.">
        <ChoiceChips label="What you'll check posters for" options={catalog.focus_areas} value={focus} onChange={setFocus} />
      </Field>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" variant="secondary" disabled={update.isPending || !changed}>Save</Button>
        <Link to="/organisation/rulebooks" className="text-sm text-muted-text underline decoration-line-strong underline-offset-4 hover:text-ink-strong">
          Choose rulebooks
        </Link>
      </div>
    </form>
  );
}
