import { Download, FileUp, Plus } from "lucide-react";
import { Link } from "react-router";
import type { Dataset } from "@/api/types";
import { Button } from "@/components/ui/button";

interface RulebookActionsProps {
  dataset: Dataset;
  onExport: () => void;
  onAdd?: () => void;
  addLabel: string;
  canEdit: boolean;
}

export function RulebookActions({ dataset, onExport, onAdd, addLabel, canEdit }: RulebookActionsProps) {
  return (
    <>
      <Button variant="ghost" onClick={onExport}>
        <Download /> Export CSV
      </Button>
      {canEdit && (
        <Button variant="secondary" asChild>
          <Link to={`/organisation/import?dataset=${dataset}`}>
            <FileUp /> Import CSV
          </Link>
        </Button>
      )}
      {canEdit && onAdd && (
        <Button onClick={onAdd}>
          <Plus /> {addLabel}
        </Button>
      )}
    </>
  );
}
