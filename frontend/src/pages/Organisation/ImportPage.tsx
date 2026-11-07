import { useSearchParams } from "react-router";
import { useImportSpecs } from "@/api/hooks/useImports";
import type { Dataset } from "@/api/types";
import { ImportWizard } from "@/components/imports/ImportWizard";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";

export function ImportPage() {
  const specs = useImportSpecs();
  const [params] = useSearchParams();
  const asked = params.get("dataset") as Dataset | null;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Organisation" }, { label: "Import data" }]}
        title="Import data"
        description="Bring in the records you already keep in spreadsheets. Every row is checked first; nothing is saved until the whole file is right."
      />
      <QueryState query={specs}>
        {(data) => <ImportWizard key={asked ?? "default"} specs={data} initial={data.some((s) => s.dataset === asked) ? asked : null} />}
      </QueryState>
    </div>
  );
}
