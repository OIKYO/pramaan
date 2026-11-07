import { useState } from "react";
import { useCourses, useToppers } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { Topper } from "@/api/types";
import { ConsentPanel } from "@/components/rulebook/ConsentPanel";
import { RulebookActions } from "@/components/rulebook/RulebookActions";
import { TopperForm } from "@/components/rulebook/TopperForm";
import { TopperTable } from "@/components/rulebook/TopperTable";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/States";
import { download } from "@/lib/csv";
import { toppersCsv } from "@/lib/rulebookCsv";

export function ToppersPage() {
  const toppers = useToppers();
  const courses = useCourses();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Topper | "new" | null>(null);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  // Show the latest copy, so the consent badge updates after an upload.
  const current = editing && editing !== "new" ? (toppers.data?.find((t) => t.id === editing.id) ?? editing) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: "Toppers register" }]}
        title="Toppers register"
        description="Students posters may show, with their verified rank, course and consent. Consent files stay private to head office."
        actions={<RulebookActions dataset="toppers" canEdit={isHeadOffice} addLabel="Add topper" onAdd={() => setEditing("new")}
          onExport={() => download("toppers.csv", toppersCsv(toppers.data ?? [], courses.data ?? []))} />}
      />
      <QueryState
        query={toppers}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No toppers registered">Posters can't show any student until they're registered here, with consent.</EmptyState>}
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            <SearchInput label="Search toppers" placeholder="Search by name" value={query} onChange={setQuery} />
            <TopperTable
              toppers={data.filter((t) => !needle || `${t.full_name} ${t.name_variants.join(" ")}`.toLowerCase().includes(needle))}
              courses={courses.data ?? []}
              onEdit={isHeadOffice ? setEditing : undefined}
            />
          </div>
        )}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add topper" : "Edit topper"}>
        {current && <ConsentPanel topper={current} />}
        {editing !== null && <TopperForm topper={current} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
