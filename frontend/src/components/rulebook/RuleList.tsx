import { useToggleRule } from "@/api/hooks/useRulebook";
import type { Rule, RulePack } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { KIND_LABEL, SEVERITY } from "@/lib/labels";


/** The checks grouped by where they come from, each with why it exists and an on/off switch.
 * Switching shows at once; it goes back if the database refuses (only head office may). */
export function RuleList({ pack, canEdit }: { pack: RulePack; canEdit: boolean }) {
  const toggle = useToggleRule();
  const columns: Column<Rule>[] = [
    {
      header: "Check",
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{r.name}</span>
          <span className="font-mono text-xs text-muted-text">{r.id}</span>
        </div>
      ),
    },
    { header: "Why it exists", cell: (r) => <span className="text-pretty text-muted-text">{r.reason}</span> },
    { header: "Kind", shrink: true, cell: (r) => <ToneBadge tone={r.kind === "ai" ? "warning" : "neutral"}>{KIND_LABEL[r.kind]}</ToneBadge> },
    { header: "Fails as", shrink: true, cell: (r) => <ToneBadge tone={SEVERITY[r.severity].tone}>{SEVERITY[r.severity].label}</ToneBadge> },
    {
      header: "On",
      align: "end",
      shrink: true,
      cell: (r) => (
        <Switch
          checked={r.enabled}
          disabled={!canEdit}
          aria-label={`${r.name}: ${r.enabled ? "on" : "off"}`}
          onCheckedChange={(enabled) =>
            toggle.mutate({ ruleId: r.id, enabled }, {
              onSuccess: () => toast.success(`${r.id} is ${enabled ? "on" : "off"} for checks from now on.`),
              onError: (e) => toast.error(e.message),
            })
          }
        />
      ),
    },
  ];

  // Groups and their names come from the rule pack (backend/rules/rule_pack.json), in pack order.
  const categories = [...new Set(pack.rules.map((r) => r.category))];
  return (
    <div className="flex flex-col gap-8">
      {categories.map((category) => {
        const rules = pack.rules.filter((r) => r.category === category);
        const title = pack.categories[category] ?? category;
        return (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-sm">
              {title} <span className="font-normal text-muted-text tabular-nums">· {rules.length}</span>
            </h2>
            <DataTable caption={title} columns={columns} rows={rules} rowKey={(r) => r.id} />
          </section>
        );
      })}
    </div>
  );
}
