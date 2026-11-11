from datetime import date, datetime, timedelta, timezone

from app import consent, state
from rules.claims import consent_problems
from rules.registry import run_rules
from tests.builders import TODAY, TOPPERS, clean_reading, make_ctx, topper_id

RIYA = TOPPERS[topper_id("Riya Sen")]
ANANYA = TOPPERS[topper_id("Ananya Roy")]
NOW = datetime(2026, 11, 7, 12, 0, tzinfo=timezone.utc)


def problems(ctx, rule_id):
    return [f for f in run_rules(ctx) if f.rule_id == rule_id and f.severity != "pass"]


def with_topper(topper, **changes):
    return {**TOPPERS, topper.id: topper.model_copy(update=changes)}


def test_a_consent_file_and_a_consent_link_both_count():
    assert RIYA.has_consent and RIYA.consent_source is None
    by_link = with_topper(RIYA, consent_path=None, consent_source="link", has_consent=True)
    assert not problems(make_ctx(toppers=by_link), "CCPA-02")


def test_withdrawn_consent_blocks_and_says_so():
    withdrawn = with_topper(RIYA, consent_source=None, has_consent=False, consent_withdrawn_at=NOW)
    found = problems(make_ctx(toppers=withdrawn), "CCPA-02")
    assert len(found) == 1 and "withdrew consent on 07 Nov 2026" in found[0].message
    assert "take it down" in found[0].suggested_fix


def test_consent_problems_name_each_gap():
    assert consent_problems(RIYA, "print", TODAY) == []
    print_only = RIYA.model_copy(update={"consent_channels": ["print"]})
    assert "covers print, not whatsapp" in consent_problems(print_only, "whatsapp", TODAY)[0][0]
    assert "expired" in consent_problems(RIYA, "print", date(2027, 6, 1))[0][0]
    unsigned = ANANYA.model_copy(update={"guardian_signed": False})
    assert any("minor" in m for m, _ in consent_problems(unsigned, "print", TODAY))


def test_approving_by_link_covers_what_was_asked():
    early = RIYA.model_copy(update={"consent_date": date(2026, 1, 1), "consent_channels": ["print"]})
    assert len(consent_problems(early, "instagram", TODAY)) == 2
    given = consent.approved_topper(early, ["print", "instagram"], date(2027, 6, 30), "self", TODAY)
    assert given.has_consent and given.consent_source == "link" and given.consent_withdrawn_at is None
    assert consent_problems(given, "instagram", TODAY) == []
    minor = consent.approved_topper(ANANYA.model_copy(update={"guardian_signed": False}), ["print"], date(2027, 6, 30),
                                    "guardian", TODAY)
    assert consent_problems(minor, "print", TODAY) == []


def test_a_minor_needs_a_parent_or_guardian():
    assert consent.relation_problem(ANANYA, "self") == "Ananya Roy is under 18, so a parent or guardian must approve."
    assert consent.relation_problem(ANANYA, "guardian") is None
    assert consent.relation_problem(RIYA, "self") is None


def test_link_status_and_dates():
    pending = {"status": "pending", "expires_at": (NOW + timedelta(days=1)).isoformat()}
    assert consent.request_status(pending, NOW) == "pending"
    assert consent.request_status({**pending, "expires_at": (NOW - timedelta(seconds=1)).isoformat()}, NOW) == "expired"
    assert consent.request_status({"status": "withdrawn", "expires_at": NOW.isoformat()}, NOW) == "withdrawn"
    assert consent.expires_at(NOW) == NOW + timedelta(days=30)
    assert consent.valid_until_problem(TODAY, TODAY) == "Choose an end date after today."
    assert consent.valid_until_problem(TODAY + timedelta(days=731), TODAY) == "Ask for consent for up to 2 years at a time."
    assert consent.valid_until_problem(TODAY + timedelta(days=365), TODAY) is None


def test_the_page_shows_what_the_poster_says_about_the_person():
    box, shown = consent.find_on_poster(clean_reading(), RIYA)
    assert box and shown[0] == "Riya Sen" and "AIR 73" in shown
    assert consent.find_on_poster(clean_reading(), TOPPERS[topper_id("Arjun Das")]) == (None, [])
    assert consent.register_lines(RIYA, "2-Year Classroom Programme") == [
        "Riya Sen", "AIR 73 in JEE Main 2026", "2-Year Classroom Programme"]


def test_withdrawal_reopens_posters_in_review_or_approved_only():
    def poster(status, stage=None):
        return state.PosterState(id="p", org_id="o", branch_id="b", region_id="r", created_by="u",
                                 status=status, review_stage=stage)
    for status, stage in (("in_review", "regional"), ("in_review", "head_office"), ("approved", None)):
        move = state.consent_withdrawn(poster(status, stage))
        assert move == state.Transition("changes_requested", None, "consent_withdrawn")
    for status in ("draft", "checked", "changes_requested"):
        assert state.consent_withdrawn(poster(status)) is None
