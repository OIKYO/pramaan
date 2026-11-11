import type { components } from "./schema";

type Schemas = components["schemas"];

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
export type Invite = Schemas["InviteOut"];
export type InviteCreate = Schemas["InviteCreate"];
export type InviteCreated = Schemas["InviteCreated"];
export type InvitePreview = Schemas["InvitePreview"];
export type CodePreview = Schemas["CodePreview"];
export type JoinWithCode = Schemas["JoinWithCode"];
export type JoinWithInvite = Schemas["JoinWithInvite"];
export type ConsentRequest = Schemas["ConsentRequestOut"];
export type ConsentRequestCreate = Schemas["ConsentRequestCreate"];
export type ConsentRequestCreated = Schemas["ConsentRequestCreated"];
export type ConsentPage = Schemas["ConsentPage"];
export type ConsentApprove = Schemas["ConsentApprove"];
export type ConsentStatus = ConsentRequest["status"];

export type Role = "branch_staff" | "regional_manager" | "head_office";
export type Channel = PosterDetail["channel"];
export type PosterStatus = PosterDetail["status"];
export type ReviewStage = NonNullable<PosterDetail["review_stage"]>;
export type Severity = Finding["severity"];
export type PosterAction = "new_version" | "submit" | "approve" | "send_back" | "resolve" | "override";

export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  role: Role;
  branch_id: string | null;
  region_id: string | null;
  email: string | null;
  needs_password_change: boolean;
  deactivated_at: string | null;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  industry_group: string | null;
  industry: string | null;
  org_type: string | null;
  focus: string[];
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
  blocking: number;
  open_issues: number;
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
  required_disclaimers: string[];
  approved_partners: string[];
  updated_at: string;
}

export type CourseType = "classroom" | "crash" | "test_series" | "online";

export interface Course {
  id: string;
  name: string;
  aliases: string[];
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
  exam: string | null;
  exam_year: number | null;
  rank: number | null;
  result_date: string | null;
  course_id: string | null;
  is_minor: boolean;
  has_consent: boolean;
  consent_source: "file" | "link" | null;
  consent_withdrawn_at: string | null;
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
