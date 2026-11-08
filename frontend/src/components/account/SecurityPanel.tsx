import { KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { DeleteAccount } from "./DeleteAccount";
import { PasswordForm } from "./PasswordForm";

export function SecurityPanel() {
  const { signOut } = useSession();
  const [changing, setChanging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  return (
    <Panel title="Security">
      <div className="flex flex-col divide-y divide-line">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink-strong">Password</span>
            <span className="text-muted-text">At least 8 characters.</span>
          </div>
          <Button variant="secondary" onClick={() => setChanging(true)}><KeyRound /> Change password</Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink-strong">Signed-in devices</span>
            <span className="text-muted-text">Sign out everywhere if you lost a device or used a shared one.</span>
          </div>
          <Button variant="secondary" onClick={() => setLeaving(true)}><LogOut /> Sign out everywhere</Button>
        </div>
        <DeleteAccount />
      </div>
      <Modal open={changing} onOpenChange={setChanging} title="Change password">
        <PasswordForm onDone={() => setChanging(false)} />
      </Modal>
      <Modal
        open={leaving}
        onOpenChange={setLeaving}
        title="Sign out everywhere?"
        description="You'll be signed out on this device and every other one, and need your password to come back."
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaving(false)}>Cancel</Button>
            <Button onClick={() => void signOut(true)}>Sign out everywhere</Button>
          </>
        }
      >
        {null}
      </Modal>
    </Panel>
  );
}
