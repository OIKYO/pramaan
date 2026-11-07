/** Friendly names for the API's types (generated into schema.d.ts by `npm run gen:api`) and the
 * shapes of the Supabase tables the frontend reads directly. */
import type { components } from "./schema";

type Schemas = components["schemas"];

// From the backend API
export type PosterDetail = Schemas["PosterDetail"];
export type Version = Schemas["VersionOut"];
export type Finding = Schemas["FindingOut"];
export type Review = Schemas["ReviewOut"];
export type Reading = Schemas["PosterReading"];
export type WordingFlag = Schemas["WordingFlag"];
export type RulePack = Schemas["RulePackOut"];
export type Rule = Schemas["RuleOut"];
export type Insights = Schemas["Insights"];
export type CountItem = Schemas["CountItem"];

export type Role = "branch_staff" | "regional_manager" | "head_office";
export type Channel = PosterDetail["channel"];
export type PosterStatus = PosterDetail["status"];
export type ReviewStage = NonNullable<PosterDetail["review_stage"]>;
export type Severity = Finding["severity"];
export type PosterAction = "new_version" | "submit" | "approve" | "send_back" | "resolve" | "override";

// Read directly from Supabase (row-level security applies)
export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  branch_id: string | null;
  region_id: string | null;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  region_id: string;
  phone: string;
  address: string;
}

export interface PosterListItem {
  id: string;
  title: string;
  channel: Channel;
  status: PosterStatus;
  review_stage: ReviewStage | null;
  current_version: number;
  updated_at: string;
  branch_name: string;
  created_by_name: string;
  /** Open block or needs-a-person findings on the current version. */
  blocking: number;
  /** All open findings that aren't passes on the current version. */
  open_issues: number;
}

export interface BrandKit {
  id: number;
  registered_name: string;
  helpline: string;
  palette: string[];
  logo_path: string | null;
  banned_phrases: string[];
  tone_notes: string;
  updated_at: string;
}

export type CourseType = "classroom" | "crash" | "test_series" | "online";

export interface Course {
  id: string;
  name: string;
  aliases: string[];
  course_type: CourseType;
  duration_label: string;
  duration_months: number;
  fee_inr: number | null;
  is_paid: boolean;
  valid_until: string | null;
  source: string;
}

export interface ResultStat {
  id: string;
  label: string;
  value: number;
  exam: string;
  year: number;
  source: string;
  valid_until: string | null;
}

/** consent_path is hidden from the browser; has_consent says whether a file is on record. */
export interface Topper {
  id: string;
  full_name: string;
  name_variants: string[];
  exam: string;
  exam_year: number;
  rank: number;
  result_date: string;
  course_id: string | null;
  is_minor: boolean;
  has_consent: boolean;
  consent_date: string | null;
  consent_channels: Channel[];
  consent_valid_until: string | null;
  guardian_signed: boolean;
  verified_at: string | null;
}

export interface AuditEntry {
  id: number;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor_name: string | null;
}
