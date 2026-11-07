import type { MemberCreated } from "@/api/types";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/CopyField";
import { Modal } from "@/components/ui/Modal";

/** The one time a temporary password is shown. Head office passes it on privately. */
export function PasswordIssued({ issued, onClose }: { issued: MemberCreated | null; onClose: () => void }) {
  const name = issued?.member.full_name.split(" ")[0] ?? "them";
  const signIn = `${window.location.origin}/login`;
  return (
    <Modal
      open={issued !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Send ${name} their temporary password`}
      description="It's shown only now. They sign in with it and then choose their own, so it stops working quickly."
    >
      {issued && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-text">Sign in at</dt>
            <dd className="text-ink-strong">{signIn}</dd>
            <dt className="text-muted-text">Email</dt>
            <dd className="break-all text-ink-strong">{issued.member.email}</dd>
          </dl>
          <CopyField label="Temporary password" value={issued.temporary_password} />
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
