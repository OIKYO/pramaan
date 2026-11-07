import { useState } from "react";
import { logoUrl, useBrandKit } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { BrandKitForm } from "@/components/rulebook/BrandKitForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingRows } from "@/components/ui/States";
import { Swatch } from "@/components/ui/Swatch";
import { formatDateTime } from "@/lib/labels";

export function BrandKitPage() {
  const kit = useBrandKit();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState(false);

  if (kit.isPending) return <LoadingRows />;
  if (kit.isError) return <ErrorState error={kit.error} onRetry={() => void kit.refetch()} />;
  const k = kit.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brand kit"
        description="What every poster must carry, and the colours and tone it should use. Used by the brand checks (BRAND-01 to BRAND-04) and banned claims (CCPA-01)."
        meta={<span>Updated {formatDateTime(k.updated_at)}</span>}
        actions={isHeadOffice && <Button onClick={() => setEditing(true)}>Edit brand kit</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {k.logo_path && <img src={logoUrl(k.logo_path)} alt="Northfield Academy logo" className="size-20 rounded border border-line" />}
            <p><span className="text-muted-text">Registered name: </span>{k.registered_name}</p>
            <p><span className="text-muted-text">Helpline: </span>{k.helpline}</p>
            <div className="flex flex-wrap gap-3">{k.palette.map((c) => <Swatch key={c} color={c} />)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Words</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-text">Tone of voice</p>
            <p>{k.tone_notes}</p>
            <p className="text-muted-text">Extra banned phrases</p>
            <ul className="list-disc pl-5">{k.banned_phrases.map((p) => <li key={p}>{p}</li>)}</ul>
          </CardContent>
        </Card>
      </div>
      <Drawer open={editing} onOpenChange={setEditing} title="Edit brand kit">
        <BrandKitForm kit={k} onDone={() => setEditing(false)} />
      </Drawer>
    </div>
  );
}
