import { useState } from "react";
import { useBrandKit } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { BrandKitForm } from "@/components/rulebook/BrandKitForm";
import { BrandKitView } from "@/components/rulebook/BrandKitView";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { formatDateTime } from "@/lib/labels";

export function BrandKitPage() {
  const kit = useBrandKit();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rulebook"
        title="Brand kit"
        description="What every poster must carry, and the colours and tone it should use."
        meta={kit.data && <span>Updated {formatDateTime(kit.data.updated_at)}</span>}
        actions={isHeadOffice && kit.data && <Button onClick={() => setEditing(true)}>Edit brand kit</Button>}
      />
      <QueryState query={kit}>
        {(data) => (
          <>
            <BrandKitView kit={data} />
            <Drawer open={editing} onOpenChange={setEditing} title="Edit brand kit" description="Changes apply to the next check that runs.">
              <BrandKitForm kit={data} onDone={() => setEditing(false)} />
            </Drawer>
          </>
        )}
      </QueryState>
    </div>
  );
}
