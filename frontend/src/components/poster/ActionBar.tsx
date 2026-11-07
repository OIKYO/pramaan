import { useState } from "react";
import { useNewVersion, useReviewPoster, useSubmitPoster } from "@/api/hooks/usePoster";
import type { PosterAction, PosterDetail, Role } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { toast } from "@/components/ui/Toast";
import { openBlockingOf } from "@/lib/findings";
import { NoteDialog } from "./NoteDialog";
import { PosterForm } from "./PosterForm";

/** What this person can do next with the poster. The server decides; this only offers it.
 * On wide screens it sits in the page header; on phones it stays at the bottom of the screen. */
export function ActionBar({ poster, role }: { poster: PosterDetail; role: Role }) {
  const actions = poster.allowed_actions as PosterAction[];
  const [uploading, setUploading] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);
  const submit = useSubmitPoster(poster.id);
  const review = useReviewPoster(poster.id);
  const newVersion = useNewVersion(poster.id);
  const onError = (error: Error) => toast.error(error.message);
  const current = poster.versions.find((v) => v.version === poster.current_version);
  const blocking = current ? openBlockingOf(current).length : 0;
  const reviewing = poster.status === "in_review" && role !== "branch_staff";
  const final = poster.review_stage === "head_office";
  const visible = actions.some((a) => ["new_version", "submit", "approve", "send_back"].includes(a)) || (reviewing && blocking > 0);
  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:border-t max-lg:border-line max-lg:bg-surface max-lg:px-4 max-lg:py-3 lg:items-end">
      <div className="flex flex-wrap gap-2 max-lg:[&>*]:flex-1">
        {actions.includes("send_back") && (
          <Button variant="secondary" onClick={() => setSendingBack(true)}>
            Send back
          </Button>
        )}
        {actions.includes("new_version") && (
          <Button variant={poster.status === "changes_requested" ? "default" : "secondary"} onClick={() => setUploading(true)}>
            Upload fixed version
          </Button>
        )}
        {actions.includes("submit") && (
          <Button onClick={() => submit.mutate(undefined, { onSuccess: () => toast.success("Submitted to your regional manager."), onError })}>
            Submit for review
          </Button>
        )}
        {actions.includes("approve") && (
          <Button
            onClick={() =>
              review.mutate({ action: "approve" }, {
                onSuccess: (d) => toast.success(d.status === "approved" ? "Approved. The branch can publish it." : "Approved. Sent to head office."),
                onError,
              })
            }
          >
            {final ? "Give final approval" : "Approve"}
          </Button>
        )}
      </div>
      {reviewing && !actions.includes("approve") && blocking > 0 && (
        <p className="text-sm text-blocked lg:max-w-sm lg:text-right">
          Approval is blocked by {blocking} open finding{blocking === 1 ? "" : "s"}. Each must be fixed in a new version, confirmed, or overridden by head office.
        </p>
      )}

      <NoteDialog
        open={sendingBack}
        onOpenChange={setSendingBack}
        title="Send back to the branch"
        description="The branch sees your comment beside the findings and uploads a fixed version."
        label="What needs to change"
        confirmLabel="Send back"
        pending={false}
        onConfirm={(comment) => {
          setSendingBack(false);
          review.mutate({ action: "send_back", comment }, { onSuccess: () => toast.success("Sent back to the branch."), onError });
        }}
      />
      <Drawer open={uploading} onOpenChange={setUploading} wide title="Upload a fixed version" description="The checks run again on the new image.">
        <PosterForm
          mode="version"
          channel={poster.channel}
          defaults={current ? { caption: current.caption, alt_text: current.alt_text, tagged_topper_ids: current.tagged_topper_ids } : undefined}
          pending={newVersion.isPending}
          onSubmit={(values) =>
            newVersion.mutate(values, {
              onSuccess: () => {
                setUploading(false);
                toast.success("New version checked.");
              },
              onError,
            })
          }
        />
      </Drawer>
    </div>
  );
}
