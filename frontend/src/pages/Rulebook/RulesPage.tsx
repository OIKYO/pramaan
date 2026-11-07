import { useRules } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { RuleList } from "@/components/rulebook/RuleList";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";

export function RulesPage() {
  const rules = useRules();
  const isHeadOffice = useProfile().role === "head_office";
  // Only the checks in rulebooks the organisation keeps run on its posters.
  const kept = new Set(rules.data?.rulebooks.filter((b) => b.enabled).map((b) => b.id));
  const active = rules.data?.rules.filter((r) => r.rulebooks.some((b) => kept.has(b)));
  const count = active?.length;
  const ai = active?.filter((r) => r.kind === "ai").length;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: "Rules" }]}
        title="Rules"
        description={
          count !== undefined
            ? `The ${count} checks in your rulebooks: ${count - (ai ?? 0)} in plain code and ${ai} by AI. AI checks only ever warn. Head office adds or removes rulebooks on the Rulebooks page.`
            : "The checks in your rulebooks."
        }
        meta={rules.data && <span>Rule pack {rules.data.version} · {rules.data.source}</span>}
      />
      <QueryState query={rules} loadingRows={8}>
        {(pack) => <RuleList pack={pack} canEdit={isHeadOffice} />}
      </QueryState>
    </div>
  );
}
