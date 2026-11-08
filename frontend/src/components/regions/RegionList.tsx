import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDeleteRegion, useSaveRegion } from "@/api/hooks/useOrganisation";
import type { Branch, MemberOut, Region } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";
import { RegionRow } from "./RegionRow";

interface RegionListProps {
  regions: Region[];
  branches: Branch[];
  members: MemberOut[];
  canEdit: boolean;
}

export function RegionList({ regions, branches, members, canEdit }: RegionListProps) {
  const save = useSaveRegion();
  const remove = useDeleteRegion();
  const [name, setName] = useState("");
  const onError = (e: Error) => toast.error(`That wasn't saved: ${e.message}`);
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    save.mutate({ name: name.trim() }, { onSuccess: () => toast.success(`${name.trim()} added.`), onError });
    setName("");
  };
  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form onSubmit={add} className="flex max-w-md gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New region, e.g. North Bengal" aria-label="New region name" maxLength={80} />
          <Button type="submit" disabled={!name.trim()}><Plus /> Add region</Button>
        </form>
      )}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {regions.map((r) => (
          <RegionRow
            key={r.id}
            region={r}
            branches={branches.filter((b) => b.region_id === r.id).map((b) => b.name)}
            managers={members.filter((m) => m.role === "regional_manager" && m.region_id === r.id && !m.deactivated_at).map((m) => m.full_name)}
            canEdit={canEdit}
            onRename={(next) => save.mutate({ id: r.id, name: next }, { onSuccess: () => toast.success(`Renamed to ${next}.`), onError })}
            onDelete={() => remove.mutate(r.id, { onSuccess: () => toast.success(`${r.name} deleted.`), onError })}
          />
        ))}
      </ul>
    </div>
  );
}
