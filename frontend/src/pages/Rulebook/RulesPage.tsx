import { useRules } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { RuleList } from "@/components/rulebook/RuleList";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";

export function RulesPage() {
  const rules = useRules();
  const isHeadOffice = useProfile().role === "head_office";
  const count = rules.data?.rules.length;
  const ai = rules.data?.rules.filter((r) => r.kind === "ai").length;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: "Rules" }]}
        title="Rules"
        description={
          count !== undefined
            ? `The ${count} checks every poster goes through: ${count - (ai ?? 0)} in plain code and ${ai} by AI. AI checks only ever warn.`
            : "The checks every poster goes through."
        }
        meta={rules.data && <span>Rule pack {rules.data.version} · {rules.data.source}</span>}
      />
      <QueryState query={rules} loadingRows={8}>
        {(pack) => <RuleList pack={pack} canEdit={isHeadOffice} />}
      </QueryState>
    </div>
  );
}
