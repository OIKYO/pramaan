import { useState } from "react";
import { useNewVersion, useReviewPoster, useSubmitPoster } from "@/api/hooks/usePoster";
import type { PosterAction, PosterDetail, Role } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { toast } from "@/components/ui/Toast";
import { openBlockingOf } from "@/lib/findings";
import { NoteDialog } from "./NoteDialog";
import { PosterForm } from "./PosterForm";

/** What this person can do next with the poster. The server decides; this only offers it. */
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
  const isReviewer = poster.status === "in_review" && (role === "head_office" || role === "regional_manager");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.includes("new_version") && (
          <Button variant={poster.status === "changes_requested" ? "default" : "outline"} onClick={() => setUploading(true)}>
            Upload fixed version
          </Button>
        )}
        {actions.includes("submit") && (
          <Button disabled={submit.isPending} onClick={() => submit.mutate(undefined, { onSuccess: () => toast.success("Submitted to your regional manager."), onError })}>
            Submit for review
          </Button>
        )}
        {actions.includes("approve") && (
          <Button
            disabled={review.isPending}
            onClick={() =>
              review.mutate({ action: "approve" }, {
                onSuccess: (d) => toast.success(d.status === "approved" ? "Approved. The branch can publish it." : "Approved. Sent to head office."),
                onError,
              })
            }
          >
            {poster.review_stage === "head_office" ? "Give final approval" : "Approve"}
          </Button>
        )}
        {actions.includes("send_back") && (
          <Button variant="outline" onClick={() => setSendingBack(true)}>
            Send back
          </Button>
        )}
      </div>
      {isReviewer && !actions.includes("approve") && blocking > 0 && (
        <p className="text-sm text-blocked">
          Approval is blocked by {blocking} open finding{blocking === 1 ? "" : "s"}. Each must be fixed in a new version,
          confirmed, or overridden by head office.
        </p>
      )}

      <NoteDialog
        open={sendingBack}
        onOpenChange={setSendingBack}
        title="Send back to the branch"
        description="The branch sees your comment next to the findings and uploads a fixed version."
        label="What needs to change"
        confirmLabel="Send back"
        pending={review.isPending}
        onConfirm={(comment) =>
          review.mutate({ action: "send_back", comment }, {
            onSuccess: () => {
              setSendingBack(false);
              toast.success("Sent back to the branch.");
            },
            onError,
          })
        }
      />
      <Drawer open={uploading} onOpenChange={setUploading} title="Upload a fixed version" description="The checks run again on the new image.">
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
