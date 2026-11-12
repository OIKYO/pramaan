import pytest
from fastapi import HTTPException

from app.demo import DEMO_ORG_ID, not_in_demo
from scripts import seed


def test_the_demo_guard_knows_the_demo_organisation():
    assert DEMO_ORG_ID == seed.ORG_ID


def test_the_demo_refuses_what_would_spoil_it_for_the_next_person():
    with pytest.raises(HTTPException) as refused:
        not_in_demo(DEMO_ORG_ID, "deleting the organisation")
    assert refused.value.status_code == 403
    assert "shared demo, so deleting the organisation is switched off" in refused.value.detail
    not_in_demo("another-organisation", "deleting the organisation")
