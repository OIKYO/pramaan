/** Rulebook exports, in the same columns as the imports, so an export can be edited and imported back. */
import type { Branch, Course, Profile, Region, ResultStat, Topper } from "@/api/types";
import { toCsv } from "./csv";

const yes = (value: boolean) => (value ? "yes" : "no");

export const coursesCsv = (courses: Course[]) =>
  toCsv(
    courses.map((c) => ({ ...c, is_paid: yes(c.is_paid) })),
    ["name", "course_type", "duration_label", "duration_months", "is_paid", "fee_inr", "aliases", "valid_until", "source"],
  );

export const statsCsv = (stats: ResultStat[]) => toCsv(stats, ["label", "value", "exam", "year", "source", "valid_until"]);

export const toppersCsv = (toppers: Topper[], courses: Course[]) =>
  toCsv(
    toppers.map((t) => ({
      ...t,
      course: courses.find((c) => c.id === t.course_id)?.name ?? "",
      is_minor: yes(t.is_minor),
      guardian_signed: yes(t.guardian_signed),
    })),
    ["full_name", "exam", "exam_year", "rank", "result_date", "course", "name_variants", "is_minor", "guardian_signed",
      "consent_date", "consent_channels", "consent_valid_until"],
  );

export const branchesCsv = (branches: Branch[], regions: Region[]) =>
  toCsv(
    branches.map((b) => ({ ...b, region: regions.find((r) => r.id === b.region_id)?.name ?? "" })),
    ["name", "region", "city", "phone", "address"],
  );

export const membersCsv = (members: Profile[], branches: Branch[], regions: Region[]) =>
  toCsv(
    members.map((m) => ({
      ...m,
      role: m.role.replace("_", " "),
      branch: branches.find((b) => b.id === m.branch_id)?.name ?? "",
      region: regions.find((r) => r.id === m.region_id)?.name ?? "",
    })),
    ["full_name", "email", "role", "branch", "region"],
  );
