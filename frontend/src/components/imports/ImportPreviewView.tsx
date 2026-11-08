import type { ImportPreview } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { ToneBadge } from "@/components/ui/ToneBadge";

interface ImportPreviewViewProps {
  preview: ImportPreview;
  fileName: string;
  pending: boolean;
  onConfirm: () => void;
  onReset: () => void;
}

const SHOWN = 50;

export function ImportPreviewView({ preview, fileName, pending, onConfirm, onReset }: ImportPreviewViewProps) {
  const creates = preview.rows.filter((r) => r.action === "create").length;
  const updates = preview.rows.filter((r) => r.action === "update").length;
  const problems = preview.issues.length;
  return (
    <Panel
      title={`Check ${fileName}`}
      description="Nothing is saved until you confirm."
      actions={
        <div className="flex flex-wrap gap-1.5">
          <ToneBadge tone="passed">{creates} new</ToneBadge>
          <ToneBadge tone="info">{updates} to update</ToneBadge>
          {problems > 0 && <ToneBadge tone="blocked">{problems} to fix</ToneBadge>}
        </div>
      }
      flush
    >
      {problems > 0 && (
        <div className="border-b border-line bg-blocked-soft/50 px-4 py-3">
          <p className="pb-2 font-medium text-ink-strong">Fix these in your spreadsheet, then upload it again. Nothing was saved.</p>
          <ul className="flex flex-col gap-1">
            {preview.issues.map((issue, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-text">
                  {issue.row > 0 ? `line ${issue.row}` : "file"}
                </span>
                <span className="w-32 shrink-0 text-xs text-ink-strong">{issue.column ?? ""}</span>
                <span className="text-ink">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {preview.rows.length > 0 && (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line text-left text-xs text-muted-text">
                <th className="h-8 px-4 font-medium">Line</th>
                <th className="h-8 px-4 font-medium">Change</th>
                {preview.columns.map((c) => <th key={c} className="h-8 px-4 font-medium whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, SHOWN).map((row) => (
                <tr key={row.row} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2 text-xs text-muted-text">{row.row}</td>
                  <td className="px-4 py-2">{row.action === "create" ? <ToneBadge tone="passed">New</ToneBadge> : <ToneBadge tone="info">Update</ToneBadge>}</td>
                  {preview.columns.map((c) => <td key={c} className="max-w-56 truncate px-4 py-2 whitespace-nowrap text-ink">{row.values[c]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.rows.length > SHOWN && <p className="px-4 py-2 text-xs text-muted-text">And {preview.rows.length - SHOWN} more rows.</p>}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3">
        <Button variant="ghost" onClick={onReset}>Choose another file</Button>
        <Button onClick={onConfirm} disabled={pending || problems > 0 || preview.rows.length === 0}>
          {pending && <Spinner />}
          Import {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"}
        </Button>
      </div>
    </Panel>
  );
}
