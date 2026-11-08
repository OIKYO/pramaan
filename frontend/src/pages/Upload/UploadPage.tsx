import { useNavigate } from "react-router";
import { usePosterUpload } from "@/api/hooks/usePosterUpload";
import { PosterForm } from "@/components/poster/PosterForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";

export function UploadPage() {
  const upload = usePosterUpload();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "My posters", to: "/branch" }, { label: "New poster" }]}
        title="New poster"
        description="Upload the final artwork. Pramaan reads it, runs every check and marks each problem on the poster, with the fix."
      />
      <PosterForm
        mode="new"
        pending={upload.isPending}
        onSubmit={(values) =>
          upload.mutate(values, {
            onSuccess: (poster) => {
              toast.success("Checks finished.");
              navigate(`/posters/${poster.id}`);
            },
            onError: (error) => toast.error(`The poster wasn't uploaded: ${error.message}`),
          })
        }
      />
    </div>
  );
}
