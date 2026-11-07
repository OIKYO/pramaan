import { useState } from "react";
import { useResultStats } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { ResultStat } from "@/api/types";
import { StatForm } from "@/components/rulebook/StatForm";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/labels";

export function ResultsPage() {
  const stats = useResultStats();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<ResultStat | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Results figures"
        description="The only success figures a poster may use. Any other number claimed as a result is blocked (CCPA-06)."
        actions={isHeadOffice && <Button onClick={() => setEditing("new")}>Add figure</Button>}
      />
      {stats.isPending ? (
        <LoadingRows />
      ) : stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : stats.data.length === 0 ? (
        <EmptyState title="No approved figures">Until head office approves a figure, posters can't claim any results figures.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Figure</TableHead><TableHead>What it counts</TableHead><TableHead>Source</TableHead><TableHead>Approved until</TableHead>
                {isHeadOffice && <TableHead className="text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-heading text-xl font-bold">{s.value}</TableCell>
                  <TableCell>{s.label}</TableCell>
                  <TableCell className="text-muted-text">{s.source}</TableCell>
                  <TableCell>{s.valid_until ? formatDate(s.valid_until) : "No end date"}</TableCell>
                  {isHeadOffice && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add figure" : "Edit figure"}>
        {editing !== null && <StatForm stat={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
