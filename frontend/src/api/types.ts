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
export type MemberOut = Schemas["MemberOut"];
export type MemberCreated = Schemas["MemberCreated"];
export type ImportPreview = Schemas["ImportPreview"];
export type ImportSpec = Schemas["DatasetSpecOut"];
export type Dataset = ImportSpec["dataset"];
export type SignupRequest = Schemas["SignupRequest"];
export type Catalog = Schemas["Catalog"];
export type Industry = Schemas["Industry"];
export type Vocabulary = Schemas["Vocabulary"];
export type Rulebook = Schemas["RulebookOut"];
export type RulebookDef = Schemas["RulebookDef"];
export type OrganisationUpdate = Schemas["OrganisationUpdate"];

export type Role = "branch_staff" | "regional_manager" | "head_office";
export type Channel = PosterDetail["channel"];
export type PosterStatus = PosterDetail["status"];
export type ReviewStage = NonNullable<PosterDetail["review_stage"]>;
export type Severity = Finding["severity"];
export type PosterAction = "new_version" | "submit" | "approve" | "send_back" | "resolve" | "override";

// Read directly from Supabase (row-level security applies)
export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  role: Role;
  branch_id: string | null;
  region_id: string | null;
  email: string | null;
  /** True while they still have the temporary password head office gave them. */
  needs_password_change: boolean;
  deactivated_at: string | null;
  created_at: string;
}

/** What the organisation does (from GET /catalog) and the rulebooks it keeps. */
export interface Organisation {
  id: string;
  name: string;
  industry_group: string | null;
  industry: string | null;
  org_type: string | null;
  focus: string[];
  /** Rulebook ids: brand, contacts, claims, offerings, figures, people, rankings. */
  rulebooks: string[];
  created_at: string;
}

export interface Region {
  id: string;
  name: string;
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
  /** Shown at once while an upload's checks run; replaced by the real poster when they finish. */
  pending?: boolean;
}

export interface BrandKit {
  org_id: string;
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
  /** Courses only. */
  course_type: CourseType | null;
  duration_label: string | null;
  duration_months: number | null;
  fee_inr: number | null;
  is_paid: boolean;
  valid_until: string | null;
  source: string;
}

export interface ResultStat {
  id: string;
  label: string;
  value: number;
  exam: string | null;
  year: number | null;
  source: string;
  valid_until: string | null;
}

/** consent_path is hidden from the browser; has_consent says whether a file is on record. */
export interface Topper {
  id: string;
  full_name: string;
  name_variants: string[];
  /** Exam fields: kept while the exam results rulebook is on. */
  exam: string | null;
  exam_year: number | null;
  rank: number | null;
  result_date: string | null;
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
