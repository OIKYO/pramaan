import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useDeleteOrganisation } from "@/api/hooks/useOrganisation";
import type { Organisation } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";

export function DeleteOrganisation({ org }: { org: Organisation }) {
  const remove = useDeleteOrganisation();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <Panel title="Delete organisation" description="Removes everything: records, posters, consent files, the audit log and every member's sign-in.">
      <Button variant="secondary" className="text-blocked" onClick={() => setOpen(true)}><Trash2 /> Delete organisation</Button>
      <Modal
        open={open}
        onOpenChange={(next) => { setOpen(next); if (!next) { setTyped(""); remove.reset(); } }}
        title={`Delete ${org.name}?`}
        description="Everything in it is deleted at once, and everyone in it loses their sign-in. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Keep the organisation</Button>
            <Button className="bg-blocked text-on-tone hover:bg-blocked/90" disabled={typed.trim() !== org.name || remove.isPending}
              onClick={() => remove.mutate(typed.trim())}>
              {remove.isPending && <Spinner />} Delete for good
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label={`Type ${org.name} to confirm`}>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </Field>
          {remove.isError && <p role="alert" className="text-sm text-blocked">{remove.error.message}</p>}
        </div>
      </Modal>
    </Panel>
  );
}
