import { Download } from "lucide-react";
import type { ImportSpec } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { download } from "@/lib/csv";

/** The columns a file needs, with an example of each, and the template to start from. */
export function ColumnGuide({ spec }: { spec: ImportSpec }) {
  return (
    <Panel
      title="Columns"
      description={`Rows are matched by ${spec.key.replace("_", " ")}: a match updates the row, anything new is added.`}
      actions={
        <Button variant="secondary" size="sm" onClick={() => download(`pramaan-${spec.dataset}-template.csv`, spec.template)}>
          <Download /> Download template
        </Button>
      }
      flush
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted-text">
              <th className="h-8 px-4 font-medium">Column</th>
              <th className="h-8 px-4 font-medium">What to write</th>
              <th className="h-8 px-4 font-medium">Example</th>
            </tr>
          </thead>
          <tbody>
            {spec.columns.map((c) => (
              <tr key={c.name} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2 align-top whitespace-nowrap">
                  <code className="text-xs text-ink-strong">{c.name}</code>
                  {c.required && <span className="ml-1.5 text-xs text-blocked">required</span>}
                </td>
                <td className="px-4 py-2 align-top text-muted-text">{c.help || "—"}</td>
                <td className="px-4 py-2 align-top text-xs whitespace-nowrap text-ink">{c.example || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
