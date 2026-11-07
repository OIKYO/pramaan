import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDeleteRegion, useSaveRegion } from "@/api/hooks/useOrganisation";
import type { Branch, Region } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/Panel";
import { toast } from "@/components/ui/Toast";

/** Regions group branches; each regional manager looks after one. */
export function RegionsPanel({ regions, branches, canEdit }: { regions: Region[]; branches: Branch[]; canEdit: boolean }) {
  const save = useSaveRegion();
  const remove = useDeleteRegion();
  const [name, setName] = useState("");
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    save.mutate({ name: name.trim() }, { onSuccess: () => setName(""), onError: (e) => toast.error(e.message) });
  };

  return (
    <Panel title="Regions" description="A regional manager reviews posters from every branch in their region.">
      <div className="flex flex-col gap-3">
        {regions.length === 0 ? (
          <p className="text-muted-text">No regions yet. Add one before adding branches.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {regions.map((r) => {
              const count = branches.filter((b) => b.region_id === r.id).length;
              return (
                <li key={r.id} className="flex items-center gap-3 py-2 first:pt-0">
                  <span className="flex-1 font-medium text-ink-strong">{r.name}</span>
                  <span className="text-xs text-muted-text tabular-nums">{count} branch{count === 1 ? "" : "es"}</span>
                  {canEdit && count === 0 && (
                    <Button variant="ghost" size="icon-xs" aria-label={`Delete ${r.name}`}
                      onClick={() => remove.mutate(r.id, { onError: (e) => toast.error(e.message) })}>
                      <X />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && (
          <form onSubmit={add} className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New region, e.g. East" aria-label="New region name" />
            <Button type="submit" variant="secondary" disabled={save.isPending || !name.trim()}>Add</Button>
          </form>
        )}
      </div>
    </Panel>
  );
}
