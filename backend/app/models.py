import re
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field, field_validator, model_validator


# Gemini's box convention: [ymin, xmin, ymax, xmax], each 0-1000 of the image height/width.
Box2D = list[int]


# A post with several pages stacks them: page n covers y from 1000*n (pipeline/pages.py).
MAX_STACKED_Y = 10_000


def _check_box(box: list[int]) -> list[int]:
    if len(box) != 4:
        raise ValueError("box_2d must be [ymin, xmin, ymax, xmax]")
    ymin, ymax = (min(max(int(v), 0), MAX_STACKED_Y) for v in (box[0], box[2]))
    xmin, xmax = (min(max(int(v), 0), 1000) for v in (box[1], box[3]))
    return [min(ymin, ymax), min(xmin, xmax), max(ymin, ymax), max(xmin, xmax)]


class _Boxed(BaseModel):
    box_2d: Box2D

    @field_validator("box_2d")
    @classmethod
    def _valid_box(cls, value: list[int]) -> list[int]:
        return _check_box(value)


class TextBlock(_Boxed):
    text: str
    romanised: str = Field(default="", description="Latin-script transliteration if the text isn't English")


class Claim(_Boxed):
    text: str


class Person(_Boxed):
    name: str
    romanised_name: str = ""
    rank_text: str = Field(default="", description="Rank as printed, e.g. 'AIR 73'")
    rank_value: int | None = None
    course_text: str = Field(default="", description="Course named next to the person")
    duration_text: str = Field(default="", description="Course duration shown next to the person")
    paid_text: str = Field(default="", description="Paid/free wording shown next to the person")


NumberKind = Literal["fee", "phone", "rank", "stat", "other"]


class NumberSeen(_Boxed):
    kind: NumberKind
    raw_text: str
    value: float | None = None


class WordingFlag(_Boxed):
    text: str
    rule_id: str = Field(description="Only 'BRAND-04' or 'AI-01'")
    why: str
    suggested_rewrite: str | None = None


class PosterReading(BaseModel):
    """Everything the reader saw on one poster version. Only what is visible; nothing guessed."""

    text_blocks: list[TextBlock] = []
    claims: list[Claim] = []
    people: list[Person] = []
    numbers: list[NumberSeen] = []
    registered_name_seen: bool = False
    helpline_seen: bool = False
    wording_flags: list[WordingFlag] = []
    other_brands: list["BrandSeen"] = []


class BrandSeen(_Boxed):
    """Another organisation's name or logo on the poster: a partner, sponsor, university or company."""

    name: str


PosterReading.model_rebuild()


class BrandKit(BaseModel):
    registered_name: str
    helpline: str
    palette: list[str] = []
    logo_path: str | None = None
    banned_phrases: list[str] = []
    tone_notes: str = ""
    required_disclaimers: list[str] = []  # LEGAL-01: every poster must carry each one
    approved_partners: list[str] = []  # RIGHTS-02: other organisations allowed on posters


class Course(BaseModel):
    id: str
    name: str
    aliases: list[str] = []
    course_type: str | None = None  # education only: classroom, crash, test_series, online
    duration_label: str | None = None
    duration_months: int | None = None
    fee_inr: int | None = None
    is_paid: bool
    valid_until: date | None = None


class ResultStat(BaseModel):
    id: str
    label: str
    value: float
    exam: str | None = None
    year: int | None = None
    valid_until: date | None = None


class Topper(BaseModel):
    id: str
    full_name: str
    name_variants: list[str] = []
    exam: str | None = None  # exam fields are filled in when the exam results rulebook is on
    exam_year: int | None = None
    rank: int | None = None
    result_date: date | None = None
    course_id: str | None = None
    is_minor: bool = False
    consent_path: str | None = None
    consent_source: Literal["file", "link"] | None = None
    has_consent: bool = False
    consent_date: date | None = None
    consent_channels: list[str] = []
    consent_valid_until: date | None = None
    consent_withdrawn_at: datetime | None = None
    guardian_signed: bool = False

    @model_validator(mode="before")
    @classmethod
    def _consent_from_file(cls, data):
        # The database sends has_consent; tests and imports may give only a consent file.
        if isinstance(data, dict) and "has_consent" not in data:
            return {**data, "has_consent": bool(data.get("consent_path") or data.get("consent_source"))}
        return data


class Branch(BaseModel):
    id: str
    name: str
    city: str
    phone: str
    address: str


class PersonMatch(BaseModel):
    """Who a person on the poster is, according to the toppers register."""

    person_index: int
    topper_id: str | None = None
    score: float = 0.0
    status: Literal["match", "needs_human", "no_match"]


class PaletteCluster(BaseModel):
    hex: str
    share: float
    delta_e: float  # distance to the nearest brand colour


class ContrastReading(BaseModel):
    block_index: int
    ratio: float
    fg: str
    bg: str


class VisualReport(BaseModel):
    width: int
    height: int
    palette: list[PaletteCluster] = []
    logo_score: float | None = None
    contrast: list[ContrastReading] = []


Kind = Literal["code", "ai", "reader"]
Severity = Literal["block", "warn", "pass", "needs_human"]


class Finding(BaseModel):
    rule_id: str
    kind: Kind
    severity: Severity
    message: str
    reason: str = ""
    evidence: dict = {}
    suggested_fix: str | None = None


class RulebookDef(BaseModel):
    """A rulebook: reference data an organisation keeps, and the checks that use it."""

    id: str
    name: str
    about: str
    behaviour: Literal["always", "conditional", "domain"] = Field(
        default="conditional",
        description="always: every organisation keeps it. conditional: its checks act only when a poster shows "
                    "what they check. domain: for particular industries, e.g. coaching ads")
    default_on: bool = Field(default=False, description="Kept by every new organisation, whatever its industry")
    required: bool = Field(default=False, description="Every organisation keeps it (behaviour 'always')")
    requires: list[str] = Field(default=[], description="Rulebooks that must be on for this one to work")


class RuleDef(BaseModel):
    id: str
    name: str
    rulebooks: list[str] = Field(default=[], description="Runs when any of these rulebooks is on; empty means always")
    kind: Kind
    severity: Severity
    reason: str
    enabled: bool = True


class RulePack(BaseModel):
    version: str
    source: str
    rulebooks: list[RulebookDef]
    rules: list[RuleDef]
    reader_checks: list[RuleDef]


Role = Literal["branch_staff", "regional_manager", "head_office"]
Channel = Literal["print", "instagram", "whatsapp"]
PosterStatus = Literal["draft", "checked", "in_review", "changes_requested", "approved"]
ReviewStage = Literal["regional", "head_office"]


class Profile(BaseModel):
    id: str
    org_id: str
    full_name: str
    role: Role
    branch_id: str | None = None
    region_id: str | None = None
    email: str | None = None
    needs_password_change: bool = False
    deactivated_at: datetime | None = None


class FindingOut(Finding):
    id: str
    version_id: str
    status: Literal["open", "resolved", "overridden"]
    override_reason: str | None = None
    resolved_by: str | None = None
    resolved_at: datetime | None = None


class PageOut(BaseModel):
    index: int
    image_url: str | None


class VersionOut(BaseModel):
    id: str
    version: int
    image_url: str | None
    image_sha256: str
    source: Literal["image", "carousel", "pdf"] = "image"
    pages: list[PageOut] = Field(default=[], description="Every page in order; boxes on page n have y from 1000*n")
    caption: str
    alt_text: str
    tagged_topper_ids: list[str]
    reading: PosterReading | None
    reader_model: str | None
    checked_at: datetime | None
    created_at: datetime
    findings: list[FindingOut]
    questions: list[WordingFlag] = Field(
        default=[], description="AI flags without a known rule id: shown to reviewers as questions, not findings")


class ReviewOut(BaseModel):
    id: str
    version_id: str | None
    actor_id: str | None
    actor_name: str
    action: str
    comment: str | None
    created_at: datetime


class PosterDetail(BaseModel):
    id: str
    title: str
    channel: Channel
    status: PosterStatus
    review_stage: ReviewStage | None
    current_version: int
    branch_id: str
    branch_name: str
    created_by: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime
    versions: list[VersionOut]
    reviews: list[ReviewOut]
    allowed_actions: list[str] = Field(
        description="What the signed-in user may do next, e.g. ['submit'] or ['approve', 'send_back']")


class RuleOut(RuleDef):
    """A rule as the Rules page shows it: the pack entry, with on/off from rule_settings."""


class RulebookOut(RulebookDef):
    enabled: bool = Field(description="Whether the signed-in user's organisation keeps this rulebook")


class RulePackOut(BaseModel):
    version: str
    source: str
    rulebooks: list[RulebookOut]
    rules: list[RuleOut]
    reader_checks: list[RuleDef]


class CountItem(BaseModel):
    key: str
    label: str
    count: int


class Insights(BaseModel):
    posters_by_status: list[CountItem]
    issues_by_branch: list[CountItem]
    issues_by_rule: list[CountItem]
    most_overridden: list[CountItem]
    total_posters: int
    open_blocking: int
    ai_calls: int


class ConsentUrl(BaseModel):
    url: str
    expires_in: int


class ConsentUploaded(BaseModel):
    topper_id: str
    has_consent: bool


class ReviewRequest(BaseModel):
    action: Literal["approve", "send_back"]
    comment: str | None = Field(default=None, max_length=2000)


class NoteRequest(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


def _strong_password(value: str) -> str:
    """At least 8 characters, with a number and a special character (the frontend checks as people type)."""
    if not re.search(r"\d", value):
        raise ValueError("Add at least one number.")
    if not re.search(r"[^A-Za-z0-9]", value):
        raise ValueError("Add at least one special character, like ! or #.")
    return value


Password = Annotated[str, Field(min_length=8, max_length=72, description="At least 8 characters, with a number and a special character"),
                     AfterValidator(_strong_password)]
# A plain check, not full RFC 5322: Supabase validates the address again when it creates the sign-in.
Email = Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)]


class SignupRequest(BaseModel):
    organisation_name: str = Field(min_length=2, max_length=120)
    full_name: str = Field(min_length=2, max_length=120)
    email: Email
    password: Password
    industry_group: str | None = Field(default=None, description="An industry id from GET /catalog")
    industry: str | None = Field(default=None, max_length=80, description="A subdomain of that industry, or the organisation's own words")
    org_type: str | None = None
    focus: list[str] = []


class SubdomainSpecial(BaseModel):
    vocabulary: str | None = None
    suggest: list[str] = []


class Industry(BaseModel):
    id: str
    name: str
    vocabulary: str
    suggest: list[str]
    subdomains: list[str]
    special: dict[str, SubdomainSpecial] = {}
    restricted: list[str] = Field(default=[], description="Claims ads in this industry may never make (LEGAL-02)")


class OrgType(BaseModel):
    id: str
    name: str
    suggest: list[str] = []


class FocusArea(BaseModel):
    id: str
    name: str
    suggest: list[str]


class Vocabulary(BaseModel):
    """The words an industry uses for what it keeps, e.g. "Courses and fees" or "Menu and prices"."""

    offerings: str
    offering: str
    offering_plural: str
    price: str
    figures: str
    figure: str
    people: str
    person: str
    person_plural: str
    register_name: str
    durations: bool
    offering_types: bool
    exams: bool


class Catalog(BaseModel):
    industries: list[Industry]
    org_types: list[OrgType]
    focus_areas: list[FocusArea]
    vocabularies: dict[str, Vocabulary]
    rulebooks: list[RulebookDef]


class OrganisationOut(BaseModel):
    id: str
    name: str
    industry_group: str | None = None
    industry: str | None = None
    org_type: str | None = None
    focus: list[str] = []
    rulebooks: list[str]
    created_at: datetime


class OrganisationUpdate(BaseModel):
    """Head office changes what the organisation does, or which rulebooks it keeps. Fields left
    out stay as they are. The industry fields go together."""

    industry_group: str | None = None
    industry: str | None = Field(default=None, max_length=80)
    org_type: str | None = None
    focus: list[str] | None = None
    rulebooks: list[str] | None = None


class MeUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


class SignupResult(BaseModel):
    org_id: str
    user_id: str
    email: str


class MemberCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: Email
    role: Role
    branch_id: str | None = None
    region_id: str | None = None


class MemberUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role: Role | None = None
    branch_id: str | None = None
    region_id: str | None = None


class MemberOut(BaseModel):
    id: str
    full_name: str
    email: str | None
    role: Role
    branch_id: str | None
    region_id: str | None
    needs_password_change: bool
    deactivated_at: datetime | None


class MemberCreated(BaseModel):
    member: MemberOut
    temporary_password: str = Field(description="Shown once. The member chooses their own when they first sign in.")


class PasswordChange(BaseModel):
    password: Password


Dataset = Literal["branches", "courses", "results", "toppers", "members"]


class ImportIssue(BaseModel):
    row: int = Field(description="Line number in the file (the header is line 1)")
    column: str | None = None
    message: str


class ImportRow(BaseModel):
    row: int
    key: str = Field(description="What identifies the row, e.g. the course name")
    action: Literal["create", "update", "skip"]
    values: dict[str, str] = Field(description="The row as read from the file")


class ImportPreview(BaseModel):
    dataset: Dataset
    columns: list[str]
    rows: list[ImportRow]
    issues: list[ImportIssue]
    committed: bool = False
    created: int = 0
    updated: int = 0
    credentials: list[dict[str, str]] = Field(
        default=[], description="For imported team members: email and temporary password, shown once")


class ImportColumn(BaseModel):
    name: str
    required: bool
    help: str
    example: str


class DatasetSpecOut(BaseModel):
    dataset: Dataset
    title: str
    description: str
    key: str
    columns: list[ImportColumn]
    template: str = Field(description="A CSV with the header and one example row")


class InviteCreate(BaseModel):
    role: Role
    branch_id: str | None = None
    region_id: str | None = None
    email: Email | None = Field(default=None, description="If given, only this email can use the invite")


class InviteOut(BaseModel):
    id: str
    role: Role
    branch_id: str | None = None
    region_id: str | None = None
    email: str | None = None
    created_by_name: str | None = None
    created_at: datetime
    expires_at: datetime
    status: Literal["pending", "used", "revoked", "expired"]


class InviteCreated(BaseModel):
    invite: InviteOut
    token: str = Field(description="Shown once: the link is <app>/join/<token>")


class InvitePreview(BaseModel):
    organisation: str
    role: Role
    branch: str | None = None
    region: str | None = None
    invited_by: str | None = None
    email: str | None = None
    expires_at: datetime


class JoinWithInvite(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: Email
    password: Password


class BranchChoice(BaseModel):
    id: str
    name: str
    city: str


class CodePreview(BaseModel):
    organisation: str
    branches: list[BranchChoice]


class JoinWithCode(JoinWithInvite):
    code: str = Field(min_length=4, max_length=20)
    branch_id: str


class JoinResult(BaseModel):
    email: str
    organisation: str


class JoinCode(BaseModel):
    code: str


class DeleteOrganisation(BaseModel):
    confirm_name: str = Field(description="The organisation's name, typed again to confirm")


# ============================================================ consent links

ConsentStatus = Literal["pending", "approved", "declined", "withdrawn", "revoked", "expired"]
SignerRelation = Literal["self", "guardian"]


class ConsentFileLink(BaseModel):
    path: str = Field(description="Open <api><path> in a new tab: it goes to the consent file. Works for expires_in seconds.")
    expires_in: int


class ConsentRequestCreate(BaseModel):
    topper_id: str
    version_id: str | None = Field(default=None, description="The poster version to show, when asking from a poster")
    channels: list[Channel] = Field(min_length=1)
    valid_until: date


class ConsentRequestOut(BaseModel):
    id: str
    topper_id: str
    topper_name: str
    poster_id: str | None = None
    poster_title: str | None = None
    channels: list[Channel]
    valid_until: date
    status: ConsentStatus
    signer_name: str | None = None
    signer_relation: SignerRelation | None = None
    decline_reason: str | None = None
    decided_at: datetime | None = None
    withdrawn_at: datetime | None = None
    expires_at: datetime
    created_at: datetime
    created_by_name: str | None = None


class ConsentRequestCreated(BaseModel):
    request: ConsentRequestOut
    token: str = Field(description="Shown once: the link is <app>/consent/<token>")


class ConsentPage(BaseModel):
    """What the person sees before they decide: the exact poster and what it says about them."""
    organisation: str
    person_name: str
    is_minor: bool
    status: ConsentStatus
    channels: list[Channel]
    valid_until: date
    poster_title: str | None = None
    image_url: str | None = None
    box_2d: Box2D | None = None
    shown: list[str] = Field(description="What the poster or the register says about the person, line by line")
    signer_name: str | None = None
    signer_relation: SignerRelation | None = None
    decided_at: datetime | None = None
    withdrawn_at: datetime | None = None
    expires_at: datetime


class ConsentApprove(BaseModel):
    signer_name: str = Field(min_length=2, max_length=120)
    relation: SignerRelation
    agree: Literal[True]


class ConsentDecline(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class ConsentWithdraw(BaseModel):
    signer_name: str = Field(min_length=2, max_length=120)
