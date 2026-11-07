import { useNavigate } from "react-router";
import { useCreatePoster } from "@/api/hooks/usePoster";
import { PosterForm } from "@/components/poster/PosterForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";

export function NewPosterPage() {
  const create = useCreatePoster();
  const navigate = useNavigate();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="New poster"
        description="Upload the final artwork. Pramaan reads it, runs 17 checks and shows every problem on the poster, with a fix."
      />
      <PosterForm
        mode="new"
        pending={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (poster) => {
              toast.success("Checks finished.");
              navigate(`/posters/${poster.id}`);
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </div>
  );
}
