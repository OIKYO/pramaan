import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useJoinCode, useRefreshJoinCode } from "@/api/hooks/useInvites";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/CopyField";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

export function JoinCodePanel({ canRefresh }: { canRefresh: boolean }) {
  const code = useJoinCode();
  const refresh = useRefreshJoinCode();
  const [confirming, setConfirming] = useState(false);
  return (
    <Panel
      title="Join code"
      description="Share it inside your organisation. People enter it on the sign-up page to join as branch staff."
      actions={canRefresh && (
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} disabled={refresh.isPending}><RefreshCw /> New code</Button>
      )}
    >
      {code.data ? (
        <CopyField label="Join code" value={code.data.code} />
      ) : code.isError ? (
        <p className="text-sm text-blocked">{code.error.message}</p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-text"><Spinner /> {refresh.isPending ? "Making a new code…" : "Loading the code…"}</p>
      )}
      <Modal
        open={confirming}
        onOpenChange={setConfirming}
        title="Make a new join code?"
        description="The current code stops working at once. People who already joined stay in; anyone still to join needs the new code."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Keep this code</Button>
            <Button onClick={() => {
              setConfirming(false);
              refresh.mutate(undefined, { onSuccess: () => toast.success("New code made. The old one no longer works."), onError: (e) => toast.error(e.message) });
            }}>Make a new code</Button>
          </>
        }
      >
        {null}
      </Modal>
    </Panel>
  );
}
