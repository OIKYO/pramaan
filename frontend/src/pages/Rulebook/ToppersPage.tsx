import { useState } from "react";
import { useCourses, useToppers } from "@/api/hooks/useRulebook";
import { useProfile } from "@/api/hooks/useSession";
import type { Topper } from "@/api/types";
import { ConsentPanel } from "@/components/rulebook/ConsentPanel";
import { TopperForm } from "@/components/rulebook/TopperForm";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { CHANNEL_LABEL, formatDate } from "@/lib/labels";

export function ToppersPage() {
  const toppers = useToppers();
  const courses = useCourses();
  const isHeadOffice = useProfile().role === "head_office";
  const [editing, setEditing] = useState<Topper | "new" | null>(null);
  const courseName = (id: string | null) => courses.data?.find((c) => c.id === id)?.name ?? "Not set";
  const current = editing && editing !== "new" ? toppers.data?.find((t) => t.id === editing.id) ?? editing : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Toppers register"
        description="Students whose results posters may show, with their verified rank, course and consent. Consent files stay private to head office."
        actions={isHeadOffice && <Button onClick={() => setEditing("new")}>Add topper</Button>}
      />
      {toppers.isPending ? (
        <LoadingRows />
      ) : toppers.isError ? (
        <ErrorState error={toppers.error} onRetry={() => void toppers.refetch()} />
      ) : toppers.data.length === 0 ? (
        <EmptyState title="No toppers registered">Posters can't show any student until head office registers them here.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead><TableHead>Rank</TableHead><TableHead>Course</TableHead><TableHead>Consent</TableHead>
                {isHeadOffice && <TableHead className="text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {toppers.data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.full_name}</p>
                    {t.is_minor && <p className="text-xs text-muted-text">Under 18{t.guardian_signed ? ", guardian signed" : ", no guardian signature"}</p>}
                  </TableCell>
                  <TableCell>AIR {t.rank} · {t.exam} {t.exam_year}</TableCell>
                  <TableCell>{courseName(t.course_id)}</TableCell>
                  <TableCell>
                    {t.has_consent ? (
                      <div className="flex flex-col gap-1">
                        <ToneBadge tone="passed">On file</ToneBadge>
                        <span className="text-xs text-muted-text">
                          Signed {t.consent_date ? formatDate(t.consent_date) : "undated"} · {t.consent_channels.map((c) => CHANNEL_LABEL[c]).join(", ")}
                        </span>
                      </div>
                    ) : (
                      <ToneBadge tone="blocked">No consent</ToneBadge>
                    )}
                  </TableCell>
                  {isHeadOffice && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>Edit</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "Add topper" : "Edit topper"}>
        {current && <ConsentPanel topper={current} />}
        {editing !== null && <TopperForm topper={current} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
