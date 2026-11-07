import { Link } from "react-router";
import type { PosterListItem } from "@/api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL, formatDateTime } from "@/lib/labels";
import { StatusPill } from "./StatusPill";

/** A list of posters with status and open issues. Titles link to the poster. */
export function PosterTable({ posters, showBranch = false }: { posters: PosterListItem[]; showBranch?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Poster</TableHead>
            {showBranch && <TableHead>Branch</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Open issues</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posters.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link to={`/posters/${p.id}`} className="font-medium text-ink underline-offset-4 hover:underline">
                  {p.title}
                </Link>
                <div className="text-xs text-muted-text">
                  {CHANNEL_LABEL[p.channel]} · version {p.current_version} · {p.created_by_name}
                </div>
              </TableCell>
              {showBranch && <TableCell>{p.branch_name}</TableCell>}
              <TableCell>
                <StatusPill status={p.status} stage={p.review_stage} />
              </TableCell>
              <TableCell>
                {p.blocking > 0 ? (
                  <ToneBadge tone="blocked">{p.blocking} blocking</ToneBadge>
                ) : p.open_issues > 0 ? (
                  <ToneBadge tone="warning">{p.open_issues} warnings</ToneBadge>
                ) : (
                  <ToneBadge tone="passed">None</ToneBadge>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-text">{formatDateTime(p.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
