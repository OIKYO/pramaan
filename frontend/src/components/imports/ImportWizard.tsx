import { useState } from "react";
import { useImport } from "@/api/hooks/useImports";
import type { Dataset, ImportPreview, ImportSpec } from "@/api/types";
import { FileDrop } from "@/components/ui/FileDrop";
import { Panel } from "@/components/ui/Panel";
import { toast } from "@/components/ui/Toast";
import { ColumnGuide } from "./ColumnGuide";
import { DatasetPicker } from "./DatasetPicker";
import { ImportPreviewView } from "./ImportPreviewView";
import { ImportResult } from "./ImportResult";

/** Choose what to import, see the columns, upload a CSV, check the preview, then confirm. */
export function ImportWizard({ specs, initial }: { specs: ImportSpec[]; initial: Dataset | null }) {
  const [dataset, setDataset] = useState<Dataset>(initial ?? specs[0].dataset);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const run = useImport();
  const spec = specs.find((s) => s.dataset === dataset) ?? specs[0];
  const reset = () => {
    setFile(null);
    setPreview(null);
  };

  const check = (picked: File) => {
    if (!/\.csv$/i.test(picked.name)) return toast.error("Upload a .csv file. In Excel or Google Sheets, use Save as or Download as CSV.");
    setFile(picked);
    run.mutate({ dataset, file: picked, commit: false }, { onSuccess: setPreview, onError: (e) => toast.error(e.message) });
  };
  const confirm = () =>
    file &&
    run.mutate({ dataset, file, commit: true }, {
      onSuccess: (result) => {
        setPreview(result);
        toast.success(`${spec.title} imported.`);
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <DatasetPicker specs={specs} value={dataset} onChange={(d) => { setDataset(d); reset(); }} />
      <div className="flex min-w-0 flex-col gap-4">
        {preview?.committed ? (
          <ImportResult result={preview} onAnother={reset} />
        ) : preview && file ? (
          <ImportPreviewView preview={preview} fileName={file.name} pending={run.isPending} onConfirm={confirm} onReset={reset} />
        ) : (
          <>
            <Panel title={`Import ${spec.title.toLowerCase()}`} description="Upload a CSV. You'll see every change, and any problem, before anything is saved.">
              <FileDrop
                accept=".csv,text/csv"
                title={run.isPending ? "Checking the file…" : "Drop a CSV here, or choose a file"}
                hint="UTF-8 or Excel CSV, up to 2 MB and 2,000 rows. Dates as YYYY-MM-DD or DD/MM/YYYY; lists separated by ;"
                onFile={check}
                disabled={run.isPending}
              />
            </Panel>
            <ColumnGuide spec={spec} />
          </>
        )}
      </div>
    </div>
  );
}
