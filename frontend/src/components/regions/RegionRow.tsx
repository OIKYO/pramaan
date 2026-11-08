import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Region } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextLink } from "@/components/ui/TextLink";

interface RegionRowProps {
  region: Region;
  branches: string[];
  managers: string[];
  canEdit: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}

/** One region: its branches and regional managers, renamed in place. A region can be deleted only
 * once it has no branches. */
export function RegionRow({ region, branches, managers, canEdit, onRename, onDelete }: RegionRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(region.name);
  const saving = region.id.startsWith("new-");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() && name.trim() !== region.name) onRename(name.trim());
    setEditing(false);
  };
  return (
    <li className="flex flex-wrap items-start gap-x-6 gap-y-3 px-4 py-4">
      <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
        {editing ? (
          <form onSubmit={submit} className="flex gap-2">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label={`New name for ${region.name}`} maxLength={80} />
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setName(region.name); setEditing(false); }}>Cancel</Button>
          </form>
        ) : (
          <h3 className="text-sm">{region.name}</h3>
        )}
        <p className="text-muted-text">
          {branches.length === 0 ? "No branches yet." : `${branches.length} branch${branches.length === 1 ? "" : "es"}: ${branches.join(", ")}`}
        </p>
        <p className="text-xs text-muted-text">
          {managers.length > 0 ? `Regional manager: ${managers.join(", ")}` : <>No regional manager yet. <TextLink to="/organisation/team">Add one on the Team page</TextLink>.</>}
        </p>
      </div>
      {canEdit && !editing && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(true)}><Pencil /> Rename</Button>
          <Button variant="ghost" size="sm" disabled={saving || branches.length > 0} onClick={onDelete}
            title={branches.length > 0 ? "Move its branches to another region first" : undefined}>
            <Trash2 /> Delete
          </Button>
        </div>
      )}
    </li>
  );
}
