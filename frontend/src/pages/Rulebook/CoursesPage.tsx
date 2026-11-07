import { useState } from "react";
import { useCourses } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { Course } from "@/api/types";
import { CourseForm } from "@/components/rulebook/CourseForm";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatInr } from "@/lib/labels";

export function CoursesPage() {
  const courses = useCourses();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Course | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses and fees"
        description="The approved courses, durations and fees. Posters must name courses and fees exactly as listed here."
        actions={isHeadOffice && <Button onClick={() => setEditing("new")}>Add course</Button>}
      />
      {courses.isPending ? (
        <LoadingRows />
      ) : courses.isError ? (
        <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
      ) : courses.data.length === 0 ? (
        <EmptyState title="No courses yet">Head office adds the approved courses here.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead><TableHead>Duration</TableHead><TableHead>Fee</TableHead><TableHead>Approved until</TableHead>
                {isHeadOffice && <TableHead className="text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-text">{c.aliases.join(", ")}</p>
                  </TableCell>
                  <TableCell>{c.duration_label}</TableCell>
                  <TableCell>{c.is_paid && c.fee_inr ? formatInr(c.fee_inr) : "Free"}</TableCell>
                  <TableCell>{c.valid_until ? formatDate(c.valid_until) : "No end date"}</TableCell>
                  {isHeadOffice && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>Edit</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add course" : "Edit course"}>
        {editing !== null && <CourseForm course={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
