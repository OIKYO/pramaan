import { Button } from "@/components/ui/button";

export function FormFooter({ pending, onCancel, onDelete, deleteLabel = "Delete" }: {
  pending: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
      <div>
        {onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} disabled={pending}>
            {deleteLabel}
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          Save
        </Button>
      </div>
    </div>
  );
}
