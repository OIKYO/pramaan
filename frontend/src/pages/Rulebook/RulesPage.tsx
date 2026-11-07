import { useRules } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { RuleList } from "@/components/rulebook/RuleList";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";

export function RulesPage() {
  const rules = useRules();
  const isHeadOffice = useProfile().role === "head_office";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rulebook"
        title="Rules"
        description="The 17 checks every poster goes through: 15 in plain code and 2 by AI. AI checks only warn; they never block on their own."
        meta={rules.data && <span>Rule pack {rules.data.version} · {rules.data.source}</span>}
      />
      <QueryState query={rules} loadingRows={8}>
        {(pack) => <RuleList pack={pack} canEdit={isHeadOffice} />}
      </QueryState>
    </div>
  );
}
