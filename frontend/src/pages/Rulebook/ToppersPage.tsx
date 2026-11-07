import { useState } from "react";
import { useCourses, useToppers } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { Topper } from "@/api/types";
import { ConsentPanel } from "@/components/rulebook/ConsentPanel";
import { TopperForm } from "@/components/rulebook/TopperForm";
import { TopperTable } from "@/components/rulebook/TopperTable";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

export function ToppersPage() {
  const toppers = useToppers();
  const courses = useCourses();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Topper | "new" | null>(null);
  // Show the latest copy, so the consent badge updates after an upload.
  const current = editing && editing !== "new" ? (toppers.data?.find((t) => t.id === editing.id) ?? editing) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rulebook"
        title="Toppers register"
        description="Students whose results posters may show, with their verified rank, course and consent. Consent files stay private to head office."
        actions={isHeadOffice && <Button onClick={() => setEditing("new")}>Add topper</Button>}
      />
      <QueryState
        query={toppers}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No toppers registered">Posters can't show any student until head office registers them here.</EmptyState>}
      >
        {(data) => <TopperTable toppers={data} courses={courses.data ?? []} onEdit={isHeadOffice ? setEditing : undefined} />}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add topper" : "Edit topper"}>
        {current && <ConsentPanel topper={current} />}
        {editing !== null && <TopperForm topper={current} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
