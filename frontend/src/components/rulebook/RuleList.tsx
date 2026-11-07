import { useToggleRule } from "@/api/hooks/useRulebook";
import type { Rule, RulePack } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { KIND_LABEL, SEVERITY } from "@/lib/labels";

const FAMILIES = [
  { prefix: "CCPA", title: "CCPA coaching guidelines", note: "Claims, toppers, consent and results." },
  { prefix: "FACT", title: "Approved facts", note: "Courses, fees, contact details and expiry dates." },
  { prefix: "BRAND", title: "Brand", note: "Logo, colours, name and tone." },
  { prefix: "ACC", title: "Accessibility", note: "Contrast and alt text." },
  { prefix: "AI", title: "AI wording", note: "Only ever warns; a person decides." },
];

/** The checks grouped by where they come from, each with why it exists and an on/off switch.
 * Switching shows at once; it goes back if the database refuses (only head office may). */
export function RuleList({ pack, canEdit }: { pack: RulePack; canEdit: boolean }) {
  const toggle = useToggleRule();
  const columns: Column<Rule>[] = [
    {
      header: "Check",
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-ink-strong">{r.name}</span>
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

  return (
    <div className="flex flex-col gap-8">
      {FAMILIES.map((family) => {
        const rules = pack.rules.filter((r) => r.id.startsWith(`${family.prefix}-`));
        if (rules.length === 0) return null;
        return (
          <section key={family.prefix} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="text-lg">{family.title}</h2>
              <p className="text-sm text-muted-text">{family.note}</p>
            </div>
            <DataTable caption={family.title} columns={columns} rows={rules} rowKey={(r) => r.id} />
          </section>
        );
      })}
    </div>
  );
}
