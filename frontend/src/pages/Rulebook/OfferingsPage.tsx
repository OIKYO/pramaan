import { useState } from "react";
import { useCourses } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { Course } from "@/api/types";
import { CourseForm } from "@/components/rulebook/CourseForm";
import { CourseTable } from "@/components/rulebook/CourseTable";
import { RulebookActions } from "@/components/rulebook/RulebookActions";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/States";
import { download } from "@/lib/csv";
import { coursesCsv } from "@/lib/rulebookCsv";

export function CoursesPage() {
  const courses = useCourses();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Course | "new" | null>(null);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Rulebook" }, { label: "Courses and fees" }]}
        title="Courses and fees"
        description="Approved courses, durations and fees. Posters must name and price courses exactly as listed (FACT-01, FACT-02)."
        actions={<RulebookActions dataset="courses" canEdit={isHeadOffice} addLabel="Add course" onAdd={() => setEditing("new")}
          onExport={() => download("courses.csv", coursesCsv(courses.data ?? []))} />}
      />
      <QueryState
        query={courses}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No courses yet">Add the approved courses, or import them from a spreadsheet.</EmptyState>}
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            <SearchInput label="Search courses" placeholder="Search courses" value={query} onChange={setQuery} />
            <CourseTable courses={data.filter((c) => !needle || `${c.name} ${c.aliases.join(" ")}`.toLowerCase().includes(needle))}
              onEdit={isHeadOffice ? setEditing : undefined} />
          </div>
        )}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add course" : "Edit course"}>
        {editing !== null && <CourseForm course={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
