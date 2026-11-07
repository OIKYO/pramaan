"""Who can invite whom, join codes, invite expiry, and the password rule."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app import invites
from app.models import PasswordChange

NOW = datetime(2026, 11, 8, 12, 0, tzinfo=timezone.utc)


def test_head_office_invites_anyone_and_regional_managers_only_their_branch_staff():
    assert invites.invite_problem("head_office", None, "regional_manager", None) is None
    assert invites.invite_problem("regional_manager", "east", "branch_staff", "east") is None
    assert "branch staff only" in invites.invite_problem("regional_manager", "east", "head_office", None)
    assert "your region" in invites.invite_problem("regional_manager", "east", "branch_staff", "north")
    assert "can't invite" in invites.invite_problem("branch_staff", None, "branch_staff", "east")


def test_join_codes_are_easy_to_read_out_and_typed_any_way():
    code = invites.new_code()
    assert len(code) == 9 and code[4] == "-"
    assert set(code.replace("-", "")) <= set(invites.CODE_ALPHABET)
    assert invites.normalise_code(" k7mq x3vp ") == "K7MQ-X3VP"
    assert invites.normalise_code("K7MQX3VP") == "K7MQ-X3VP"


def test_an_invite_is_pending_until_used_cancelled_or_seven_days_old():
    row = {"expires_at": invites.expiry(NOW).isoformat(), "used_at": None, "revoked_at": None}
    assert invites.invite_status(row, NOW) == "pending"
    assert invites.invite_status(row, NOW + timedelta(days=7, seconds=1)) == "expired"
    assert invites.invite_status({**row, "used_at": NOW.isoformat()}, NOW) == "used"
    assert invites.invite_status({**row, "revoked_at": NOW.isoformat()}, NOW) == "revoked"


def test_only_a_hash_of_the_invite_token_is_kept():
    token = invites.new_token()
    assert len(token) >= 32 and invites.token_hash(token) != token and len(invites.token_hash(token)) == 64


@pytest.mark.parametrize("password,ok", [
    ("short1!", False),          # under 8 characters
    ("longenough!", False),      # no number
    ("longenough1", False),      # no special character
    ("long-enough-1", True),
    ("Northfield-demo-2026", True),
])
def test_passwords_need_8_characters_a_number_and_a_special_character(password, ok):
    if ok:
        PasswordChange(password=password)
    else:
        with pytest.raises(ValidationError):
            PasswordChange(password=password)
