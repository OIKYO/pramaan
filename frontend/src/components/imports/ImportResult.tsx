import { CircleCheck, Download } from "lucide-react";
import type { ImportPreview } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { download, toCsv } from "@/lib/csv";

/** After an import: what changed and, for new team members, their temporary passwords (shown once). */
export function ImportResult({ result, onAnother }: { result: ImportPreview; onAnother: () => void }) {
  const credentials = result.credentials;
  return (
    <Panel>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <CircleCheck className="mt-0.5 size-5 text-passed" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-ink-strong">
              Imported: {result.created} added, {result.updated} updated.
            </p>
            <p className="text-muted-text">Posters checked from now on use these records. The audit log records the import.</p>
          </div>
        </div>
        {credentials.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-warning-mark/50 bg-warning-soft/60 p-3">
            <p className="font-medium text-ink-strong">Temporary passwords: shown only now</p>
            <p className="text-muted-text">Send each person theirs privately. They choose their own the first time they sign in.</p>
            <ul className="flex flex-col gap-1 text-xs">
              {credentials.map((c) => (
                <li key={c.email} className="flex flex-wrap gap-x-4">
                  <span className="text-ink-strong">{c.email}</span>
                  <span className="select-all text-ink">{c.temporary_password}</span>
                </li>
              ))}
            </ul>
            <div>
              <Button variant="secondary" size="sm" onClick={() => download("pramaan-sign-in-details.csv", toCsv(credentials, ["full_name", "email", "temporary_password"]))}>
                <Download /> Download as CSV
              </Button>
            </div>
          </div>
        )}
        <div>
          <Button variant="secondary" onClick={onAnother}>Import another file</Button>
        </div>
      </div>
    </Panel>
  );
}
