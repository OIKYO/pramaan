import { useVocabulary } from "@/api/hooks/useCatalog";
import { useToggleRule } from "@/api/hooks/useRulebook";
import type { Rule, RulePack } from "@/api/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { KIND_LABEL, SEVERITY } from "@/lib/labels";

export function RuleList({ pack, canEdit }: { pack: RulePack; canEdit: boolean }) {
  const toggle = useToggleRule();
  const words = useVocabulary();
  const names: Record<string, string> = { offerings: words.offerings, figures: words.figures, people: words.people };
  const columns: Column<Rule>[] = [
    {
      header: "Check",
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-ink-strong">{r.name}</span>
          <span className="text-xs text-muted-text">{r.id}</span>
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

  // A rule in two rulebooks (FACT-04) shows under the first one that is kept.
  const kept = pack.rulebooks.filter((b) => b.enabled);
  const placed = new Set<string>();
  const sections = kept.map((book) => {
    const rules = pack.rules.filter((r) => r.rulebooks.includes(book.id) && !placed.has(r.id));
    rules.forEach((r) => placed.add(r.id));
    return { book, rules };
  });
  return (
    <div className="flex flex-col gap-8">
      {sections.filter((s) => s.rules.length > 0).map(({ book, rules }) => (
        <section key={book.id} className="flex flex-col gap-3">
          <h2 className="text-sm">
            {names[book.id] ?? book.name} <span className="font-normal text-muted-text tabular-nums">· {rules.length}</span>
          </h2>
          <DataTable caption={book.name} columns={columns} rows={rules} rowKey={(r) => r.id} />
        </section>
      ))}
    </div>
  );
}
