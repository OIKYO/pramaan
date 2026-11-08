import { UserX } from "lucide-react";
import { useState } from "react";
import { useDeleteMyAccount } from "@/api/hooks/useAccount";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

export function DeleteAccount() {
  const remove = useDeleteMyAccount();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-ink-strong">Delete my account</span>
        <span className="text-muted-text">Removes your name and email. Your posters and reviews stay in the organisation's history.</span>
      </div>
      <Button variant="secondary" className="text-blocked" onClick={() => setOpen(true)}><UserX /> Delete my account</Button>
      <Modal
        open={open}
        onOpenChange={(next) => { setOpen(next); if (!next) remove.reset(); }}
        title="Delete your account?"
        description="You'll be signed out and can't sign in again. Posters and reviews you made stay, shown as made by a former member. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Keep my account</Button>
            <Button className="bg-blocked text-on-tone hover:bg-blocked/90" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending && <Spinner />} Delete my account
            </Button>
          </>
        }
      >
        {remove.isError ? <p role="alert" className="text-sm text-blocked">{remove.error.message}</p> : null}
      </Modal>
    </div>
  );
}
