import { useState } from "react";
import { useCourses } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { Course } from "@/api/types";
import { CourseForm } from "@/components/rulebook/CourseForm";
import { CourseTable } from "@/components/rulebook/CourseTable";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/QueryState";
import { EmptyState } from "@/components/ui/States";

export function CoursesPage() {
  const courses = useCourses();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Course | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rulebook"
        title="Courses and fees"
        description="The approved courses, durations and fees. Posters must name courses and fees exactly as listed here (FACT-01, FACT-02)."
        actions={isHeadOffice && <Button onClick={() => setEditing("new")}>Add course</Button>}
      />
      <QueryState
        query={courses}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title="No courses yet">Head office adds the approved courses here.</EmptyState>}
      >
        {(data) => <CourseTable courses={data} onEdit={isHeadOffice ? setEditing : undefined} />}
      </QueryState>
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add course" : "Edit course"}>
        {editing !== null && <CourseForm course={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
