"""Poster status machine and permissions. Pure functions, no database.

    create version -> draft -(pipeline done)-> checked
    checked -(branch submits)-> in_review [regional]
    in_review/regional -(regional approves)-> in_review [head_office]
    in_review -(regional or head office sends back)-> changes_requested
    changes_requested -(branch uploads a new version)-> draft -> checked -> ...
    in_review/head_office -(head office final approve)-> approved

The backend bypasses row-level security, so every function here also checks that the user may
see the poster at all (the same rule as policies.sql).
"""

from dataclasses import dataclass

from app.models import Profile

BLOCKING = ("block", "needs_human")
STATUS_LABEL = {
    "draft": "being checked", "checked": "checked", "in_review": "in review",
    "changes_requested": "sent back for changes", "approved": "approved",
}


class Refused(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


@dataclass(frozen=True)
class PosterState:
    id: str
    org_id: str
    branch_id: str
    region_id: str
    created_by: str
    status: str
    review_stage: str | None


@dataclass(frozen=True)
class FindingState:
    id: str
    severity: str
    status: str


@dataclass(frozen=True)
class Transition:
    status: str
    review_stage: str | None
    action: str


def can_view(user: Profile, poster: PosterState) -> bool:
    if user.org_id != poster.org_id:  # another organisation's poster doesn't exist for this user
        return False
    if user.role == "head_office":
        return True
    if user.role == "branch_staff":
        return user.branch_id == poster.branch_id
    return user.role == "regional_manager" and user.region_id == poster.region_id


def _must_view(user: Profile, poster: PosterState) -> None:
    if not can_view(user, poster):
        raise Refused(404, "Poster not found. It may belong to a branch outside your area.")


def _is_branch_staff_for(user: Profile, poster: PosterState) -> bool:
    return user.role == "branch_staff" and user.branch_id == poster.branch_id


def open_blocking(findings: list[FindingState]) -> list[FindingState]:
    return [f for f in findings if f.status == "open" and f.severity in BLOCKING]


def check_create(user: Profile) -> None:
    if user.role != "branch_staff":
        raise Refused(403, "Only branch staff can upload posters.")
    if not user.branch_id:
        raise Refused(403, "Your account isn't linked to a branch. Ask head office to fix your profile.")


def check_new_version(user: Profile, poster: PosterState) -> Transition:
    _must_view(user, poster)
    if not _is_branch_staff_for(user, poster):
        raise Refused(403, "Only staff at this poster's branch can upload a new version.")
    if poster.status not in ("checked", "changes_requested"):
        raise Refused(409, f"A new version can be uploaded once the poster is checked or sent back. "
                           f"Right now it's {STATUS_LABEL[poster.status]}.")
    return Transition("draft", None, "new_version")


def checked() -> Transition:
    return Transition("checked", None, "checked")


def consent_withdrawn(poster: PosterState) -> Transition | None:
    """A poster in review or approved goes back to the branch when someone on it withdraws consent."""
    if poster.status in ("in_review", "approved"):
        return Transition("changes_requested", None, "consent_withdrawn")
    return None


def submit(user: Profile, poster: PosterState) -> Transition:
    _must_view(user, poster)
    if not _is_branch_staff_for(user, poster):
        raise Refused(403, "Only staff at this poster's branch can submit it for review.")
    if poster.status != "checked":
        raise Refused(409, f"Only a checked poster can be submitted. Right now it's {STATUS_LABEL[poster.status]}.")
    return Transition("in_review", "regional", "submitted")


def _is_stage_reviewer(user: Profile, poster: PosterState) -> bool:
    return (poster.review_stage == "regional" and user.role == "regional_manager") or (
        poster.review_stage == "head_office" and user.role == "head_office")


def review(user: Profile, poster: PosterState, action: str, findings: list[FindingState],
           comment: str | None) -> Transition:
    _must_view(user, poster)
    if poster.status != "in_review":
        raise Refused(409, f"This poster isn't waiting for review. Right now it's {STATUS_LABEL[poster.status]}.")

    if action == "send_back":
        if not (_is_stage_reviewer(user, poster) or user.role == "head_office"):
            raise Refused(403, "Only the reviewer at this stage, or head office, can send the poster back.")
        if not (comment or "").strip():
            raise Refused(422, "Say what needs to change, so the branch knows what to fix.")
        return Transition("changes_requested", None, "sent_back")

    if action != "approve":
        raise Refused(422, "The action must be 'approve' or 'send_back'.")
    if not _is_stage_reviewer(user, poster):
        who = "a regional manager" if poster.review_stage == "regional" else "head office"
        raise Refused(403, f"At this stage, {who} approves the poster.")
    if poster.created_by == user.id:
        raise Refused(403, "You can't approve a poster you created.")
    if blocking := open_blocking(findings):
        raise Refused(409, f"Approval is blocked by {len(blocking)} open finding(s). Each must be fixed in a new "
                           "version, confirmed by a reviewer, or overridden by head office first.")
    if poster.review_stage == "regional":
        return Transition("in_review", "head_office", "approved")
    return Transition("approved", None, "final_approved")


def resolve(user: Profile, poster: PosterState, finding: FindingState, note: str) -> None:
    _must_view(user, poster)
    if user.role not in ("regional_manager", "head_office"):
        raise Refused(403, "Only reviewers can confirm a reading.")
    if poster.status != "in_review":
        raise Refused(409, "Readings are confirmed during review. Submit the poster first.")
    if finding.severity != "needs_human" or finding.status != "open":
        raise Refused(409, "Only open findings that need a person can be confirmed.")
    if not note.strip():
        raise Refused(422, "Add a note saying what you checked.")


def override(user: Profile, poster: PosterState, finding: FindingState, reason: str) -> None:
    _must_view(user, poster)
    if user.role != "head_office":
        raise Refused(403, "Only head office can override a blocking finding.")
    if poster.status != "in_review":
        raise Refused(409, "Findings are overridden during review.")
    if finding.severity != "block" or finding.status != "open":
        raise Refused(409, "Only open blocking findings can be overridden.")
    if not reason.strip():
        raise Refused(422, "Write the reason for the override. It's kept in the audit log.")


def allowed_actions(user: Profile, poster: PosterState, findings: list[FindingState]) -> list[str]:
    attempts = {
        "new_version": lambda: check_new_version(user, poster),
        "submit": lambda: submit(user, poster),
        "approve": lambda: review(user, poster, "approve", findings, None),
        "send_back": lambda: review(user, poster, "send_back", findings, "check"),
    }
    actions = []
    for name, attempt in attempts.items():
        try:
            attempt()
            actions.append(name)
        except Refused:
            pass
    reviewing = poster.status == "in_review" and can_view(user, poster)
    if reviewing and user.role in ("regional_manager", "head_office"):
        actions.append("resolve")
    if reviewing and user.role == "head_office":
        actions.append("override")
    return actions
