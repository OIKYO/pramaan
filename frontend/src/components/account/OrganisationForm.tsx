import { useState, type FormEvent } from "react";
import { useRenameOrganisation } from "@/api/hooks/useOrganisation";
import type { Organisation } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";

/** Head office renames the organisation. The registered name on posters lives in the brand kit. */
export function OrganisationForm({ org }: { org: Organisation }) {
  const rename = useRenameOrganisation();
  const [name, setName] = useState(org.name);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error("Enter at least 2 characters.");
    rename.mutate({ id: org.id, name: name.trim() }, {
      onSuccess: () => toast.success("Organisation renamed."),
      onError: (e) => toast.error(`It wasn't renamed: ${e.message}`),
    });
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Organisation name" hint="Shown in the menu. The name posters must carry is set in the brand kit.">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </Field>
      <div>
        <Button type="submit" variant="secondary" disabled={rename.isPending || name.trim() === org.name}>Save name</Button>
      </div>
    </form>
  );
}
