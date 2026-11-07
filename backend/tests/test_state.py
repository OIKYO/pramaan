"""The status machine and permission rules (CLAUDE.md section 7)."""

import pytest

from app import state
from app.models import Profile
from app.state import FindingState, PosterState, Refused

STAFF = Profile(id="u-staff", org_id="org-1", full_name="Tara Ghosh", role="branch_staff", branch_id="b-siliguri")
OTHER_STAFF = Profile(id="u-staff2", org_id="org-1", full_name="Rahul Sarkar", role="branch_staff", branch_id="b-kolkata")
REGIONAL = Profile(id="u-regional", org_id="org-1", full_name="Vikram Bose", role="regional_manager", region_id="r-east")
OTHER_REGIONAL = Profile(id="u-regional2", org_id="org-1", full_name="Someone", role="regional_manager", region_id="r-west")
HQ = Profile(id="u-hq", org_id="org-1", full_name="Meera Iyer", role="head_office")
OTHER_ORG_HQ = Profile(id="u-hq2", org_id="org-2", full_name="Asha Rao", role="head_office")


def poster(status="checked", stage=None, created_by="u-staff") -> PosterState:
    return PosterState(id="p1", org_id="org-1", branch_id="b-siliguri", region_id="r-east", created_by=created_by,
                       status=status, review_stage=stage)


CLEAN = [FindingState("f1", "pass", "open"), FindingState("f2", "warn", "open")]
BLOCKED = [*CLEAN, FindingState("f3", "block", "open")]
ASKS_A_PERSON = [*CLEAN, FindingState("f4", "needs_human", "open")]


def refused(fn, *args) -> int:
    with pytest.raises(Refused) as caught:
        fn(*args)
    return caught.value.status


# ---------------------------------------------------------------- the happy path


def test_full_flow_staff_submit_regional_approve_head_office_final_approve():
    t = state.submit(STAFF, poster("checked"))
    assert (t.status, t.review_stage, t.action) == ("in_review", "regional", "submitted")
    t = state.review(REGIONAL, poster("in_review", "regional"), "approve", CLEAN, None)
    assert (t.status, t.review_stage, t.action) == ("in_review", "head_office", "approved")
    t = state.review(HQ, poster("in_review", "head_office"), "approve", CLEAN, None)
    assert (t.status, t.review_stage, t.action) == ("approved", None, "final_approved")


def test_send_back_then_new_version():
    t = state.review(REGIONAL, poster("in_review", "regional"), "send_back", BLOCKED, "Fix the rank")
    assert (t.status, t.review_stage) == ("changes_requested", None)
    assert state.check_new_version(STAFF, poster("changes_requested")).status == "draft"


# ---------------------------------------------------------------- the rules


def test_nobody_approves_their_own_poster():
    assert refused(state.review, HQ, poster("in_review", "head_office", created_by="u-hq"), "approve", CLEAN, None) == 403


@pytest.mark.parametrize("findings", [BLOCKED, ASKS_A_PERSON])
def test_no_approval_with_open_block_or_needs_human_findings(findings):
    assert refused(state.review, REGIONAL, poster("in_review", "regional"), "approve", findings, None) == 409
    assert refused(state.review, HQ, poster("in_review", "head_office"), "approve", findings, None) == 409


def test_resolved_or_overridden_findings_no_longer_block():
    settled = [*CLEAN, FindingState("f3", "block", "overridden"), FindingState("f4", "needs_human", "resolved")]
    assert state.review(REGIONAL, poster("in_review", "regional"), "approve", settled, None).status == "in_review"


def test_ai_warnings_never_block_approval():
    assert state.review(REGIONAL, poster("in_review", "regional"), "approve", [FindingState("f", "warn", "open")], None)


def test_override_only_by_head_office_with_a_reason():
    block = FindingState("f3", "block", "open")
    in_review = poster("in_review", "head_office")
    assert refused(state.override, REGIONAL, poster("in_review", "regional"), block, "fine") == 403
    assert refused(state.override, HQ, in_review, block, "   ") == 422
    state.override(HQ, in_review, block, "Rank verified against the official result PDF.")
    assert refused(state.override, HQ, in_review, FindingState("f5", "needs_human", "open"), "x") == 409


def test_reviewers_confirm_needs_human_readings_with_a_note():
    finding = FindingState("f4", "needs_human", "open")
    in_review = poster("in_review", "regional")
    assert refused(state.resolve, STAFF, in_review, finding, "ok") == 403
    assert refused(state.resolve, REGIONAL, in_review, finding, "") == 422
    state.resolve(REGIONAL, in_review, finding, "The rank on the poster reads 73.")
    assert refused(state.resolve, REGIONAL, in_review, FindingState("f3", "block", "open"), "x") == 409


def test_send_back_needs_a_comment():
    assert refused(state.review, REGIONAL, poster("in_review", "regional"), "send_back", CLEAN, "  ") == 422


def test_each_stage_has_its_own_approver():
    assert refused(state.review, HQ, poster("in_review", "regional"), "approve", CLEAN, None) == 403
    assert refused(state.review, REGIONAL, poster("in_review", "head_office"), "approve", CLEAN, None) == 403
    # Head office may send back at either stage.
    assert state.review(HQ, poster("in_review", "regional"), "send_back", CLEAN, "Wrong photo").status == "changes_requested"


def test_only_the_posters_branch_can_submit_or_upload_versions():
    assert refused(state.submit, REGIONAL, poster("checked")) == 403
    assert refused(state.submit, STAFF, poster("draft")) == 409
    assert refused(state.check_new_version, STAFF, poster("in_review", "regional")) == 409
    assert refused(state.check_create, REGIONAL) == 403


def test_other_branches_and_regions_cant_see_the_poster():
    assert refused(state.submit, OTHER_STAFF, poster("checked")) == 404
    assert refused(state.review, OTHER_REGIONAL, poster("in_review", "regional"), "approve", CLEAN, None) == 404
    assert state.can_view(HQ, poster()) and state.can_view(REGIONAL, poster())


def test_allowed_actions_follow_the_rules():
    assert state.allowed_actions(STAFF, poster("checked"), CLEAN) == ["new_version", "submit"]
    regional_view = state.allowed_actions(REGIONAL, poster("in_review", "regional"), BLOCKED)
    assert "approve" not in regional_view and {"send_back", "resolve"} <= set(regional_view)
    assert "override" in state.allowed_actions(HQ, poster("in_review", "head_office"), BLOCKED)
    assert state.allowed_actions(STAFF, poster("approved"), CLEAN) == []


def test_another_organisations_head_office_cant_see_or_act_on_a_poster():
    target = poster(status="in_review", stage="head_office")
    assert not state.can_view(OTHER_ORG_HQ, target)
    with pytest.raises(state.Refused) as refused:
        state.review(OTHER_ORG_HQ, target, "approve", [], None)
    assert refused.value.status == 404
