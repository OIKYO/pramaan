import { Link } from "react-router";
import { completeRulebooks, useCatalog, useVocabulary } from "@/api/hooks/useCatalog";
import type { Organisation } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { formatDate } from "@/lib/labels";
import { DeleteOrganisation } from "./DeleteOrganisation";
import { JoinCodePanel } from "./JoinCodePanel";
import { OrganisationForm } from "./OrganisationForm";
import { OrgProfileForm } from "./OrgProfileForm";

/** The organisation's name and what it does, with the rulebooks it keeps beside them. */
export function OrganisationProfile({ org, canEdit }: { org: Organisation; canEdit: boolean }) {
  const catalog = useCatalog().data;
  const words = useVocabulary();
  const names: Record<string, string> = { offerings: words.offerings, figures: words.figures, people: words.people };
  const kept = (catalog?.rulebooks ?? []).filter((b) => completeRulebooks(catalog, org.rulebooks).includes(b.id));
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex flex-col gap-4">
        <Panel title="Name" description={`On Pramaan since ${formatDate(org.created_at)}.`}>
          {canEdit ? <OrganisationForm org={org} /> : <p className="font-medium text-ink-strong">{org.name}</p>}
        </Panel>
        <Panel title="What it does" description="Picks the words Pramaan uses and the rulebooks it suggests.">
          <OrgProfileForm key={`${org.industry_group}-${org.industry}-${org.org_type}`} org={org} canEdit={canEdit} />
        </Panel>
        {canEdit && <DeleteOrganisation org={org} />}
      </div>
      <div className="flex flex-col gap-4">
        {canEdit && <JoinCodePanel canRefresh />}
        <Panel
          title="Rulebooks you keep"
          description={`${kept.length} of ${catalog?.rulebooks.length ?? "…"}. Posters are checked against these.`}
          actions={
            <Button variant="secondary" size="sm" asChild>
              <Link to="/organisation/rulebooks">Choose rulebooks</Link>
            </Button>
          }
        >
          <ul className="flex flex-col gap-2">
            {kept.map((b) => (
              <li key={b.id} className="flex items-center gap-2.5 text-ink-strong">
                <span aria-hidden className="size-1.5 rounded-full bg-passed" />
                {names[b.id] ?? b.name}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
