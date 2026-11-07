import { useEffect } from "react";
import { useLocation } from "react-router";
import type { Organisation } from "@/api/types";
import { OrgProfileForm } from "@/components/organisation/OrgProfileForm";
import { Panel } from "@/components/ui/Panel";
import { scrollToItem } from "@/lib/motion";
import { OrganisationForm } from "./OrganisationForm";

/** The organisation's name, and what it does. Head office edits both; everyone else reads them. */
export function OrganisationPanel({ org, canEdit }: { org: Organisation; canEdit: boolean }) {
  const { hash } = useLocation();
  // The account menu's "Organisation" opens Settings here.
  useEffect(() => {
    if (hash === "#organisation") scrollToItem(document.getElementById("organisation"));
  }, [hash]);
  return (
    <div id="organisation" className="flex scroll-mt-6 flex-col gap-4">
      <Panel title="Organisation" description={canEdit ? undefined : "Head office manages these."}>
        {canEdit ? <OrganisationForm org={org} /> : <p className="font-medium text-ink-strong">{org.name}</p>}
      </Panel>
      <Panel title="What your organisation does" description="Picks the words Pramaan uses and suggests rulebooks.">
        <OrgProfileForm key={`${org.industry_group}-${org.industry}-${org.org_type}`} org={org} canEdit={canEdit} />
      </Panel>
    </div>
  );
}
