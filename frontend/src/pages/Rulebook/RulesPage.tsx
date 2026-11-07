import { useRules, useToggleRule } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingRows } from "@/components/ui/States";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { KIND_LABEL, SEVERITY } from "@/lib/labels";

export function RulesPage() {
  const rules = useRules();
  const toggle = useToggleRule();
  const isHeadOffice = useProfile().role === "head_office";

  if (rules.isPending) return <LoadingRows rows={8} />;
  if (rules.isError) return <ErrorState error={rules.error} onRetry={() => void rules.refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rules"
        description={`The ${rules.data.rules.length} checks every poster goes through: 15 in plain code and 2 by AI. AI checks only warn; they never block on their own.`}
        meta={<span>Rule pack {rules.data.version} · {rules.data.source}</span>}
      />
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check</TableHead><TableHead>Why it exists</TableHead><TableHead>Kind</TableHead><TableHead>Fails as</TableHead><TableHead>On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.data.rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="align-top">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-text">{r.id}</p>
                </TableCell>
                <TableCell className="max-w-md align-top text-sm whitespace-normal text-muted-text">{r.reason}</TableCell>
                <TableCell className="align-top">
                  <ToneBadge tone={r.kind === "ai" ? "warning" : "neutral"}>{KIND_LABEL[r.kind]}</ToneBadge>
                </TableCell>
                <TableCell className="align-top">
                  <ToneBadge tone={SEVERITY[r.severity].tone}>{SEVERITY[r.severity].label}</ToneBadge>
                </TableCell>
                <TableCell className="align-top">
                  <Switch
                    checked={r.enabled}
                    disabled={!isHeadOffice || toggle.isPending}
                    aria-label={`${r.name} ${r.enabled ? "on" : "off"}`}
                    onCheckedChange={(enabled) =>
                      toggle.mutate({ ruleId: r.id, enabled }, {
                        onSuccess: () => toast.success(`${r.id} switched ${enabled ? "on" : "off"} for new checks.`),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
