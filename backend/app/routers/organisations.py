"""Organisations: signing up, what the organisation does, and which rulebooks it keeps.

Whoever signs up becomes the organisation's head office. Everything they add is visible only
inside their organisation. The industry they choose suggests rulebooks and sets the words the app
uses; head office can add or remove rulebooks at any time.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require
from app.catalog import (
    OTHER_INDUSTRY, ProfileError, check_profile, check_rulebooks, complete, load_catalog, suggested_rulebooks,
)
from app.db import audit, get_db
from app.models import Catalog, OrganisationOut, OrganisationUpdate, Profile, SignupRequest, SignupResult
from app.team import add_profile, create_login
from rules.registry import load_rule_pack

log = logging.getLogger(__name__)
router = APIRouter(tags=["organisations"])
HeadOffice = Annotated[Profile, Depends(require("head_office"))]
ORG_COLUMNS = "id, name, industry_group, industry, org_type, focus, rulebooks, created_at"


@router.get("/catalog", response_model=Catalog)
def catalog() -> Catalog:
    """Industries, kinds of organisation, focus areas, each industry's words and the rulebooks.
    The same for everyone, and needed before sign-up, so no sign-in."""
    return Catalog(**load_catalog(), rulebooks=load_rule_pack().rulebooks)


def _profile(group: str | None, industry: str | None, org_type: str | None, focus: list[str]) -> dict:
    """A checked profile as database columns. 400 with a plain message if it doesn't fit the catalog."""
    try:
        group, industry, org_type, focus = check_profile(group or "", industry or "", org_type or "", focus)
    except ProfileError as exc:
        raise HTTPException(400, str(exc)) from None
    return {"industry_group": group, "industry": industry, "org_type": org_type, "focus": focus}


@router.post("/signup", response_model=SignupResult, status_code=201)
def signup(body: SignupRequest) -> SignupResult:
    """Create an organisation and its first head office account. No sign-in needed."""
    profile: dict = {}
    if body.industry_group:
        profile = _profile(body.industry_group, body.industry or OTHER_INDUSTRY, body.org_type or "other", body.focus)
    rulebooks = suggested_rulebooks(profile.get("industry_group"), profile.get("industry"), profile.get("org_type"),
                                    profile.get("focus", []))

    db = get_db()
    name, full_name, email = body.organisation_name.strip(), body.full_name.strip(), body.email.strip().lower()
    user_id = create_login(db, email, body.password, full_name)
    org_id = None
    try:
        org_id = db.table("organisations").insert(
            {"name": name, "created_by": user_id, "rulebooks": rulebooks, **profile}).execute().data[0]["id"]
        add_profile(db, user_id, org_id, full_name, email, "head_office", None, None, needs_password_change=False)
        db.table("brand_kit").insert({"org_id": org_id, "registered_name": name, "helpline": ""}).execute()
        db.table("rule_settings").insert(
            [{"org_id": org_id, "rule_id": r.id, "enabled": r.enabled} for r in load_rule_pack().rules]).execute()
    except Exception:
        log.exception("Signup failed for %s", email)
        if org_id:
            db.table("organisations").delete().eq("id", org_id).execute()  # cascades to its rows
        db.auth.admin.delete_user(user_id)
        raise HTTPException(500, "Your organisation couldn't be created. Nothing was saved; try again.") from None
    audit(org_id, user_id, "organisation_created", "organisation", org_id, {"name": name, "rulebooks": rulebooks, **profile})
    return SignupResult(org_id=org_id, user_id=user_id, email=email)


@router.patch("/organisation", response_model=OrganisationOut)
def update_organisation(body: OrganisationUpdate, user: HeadOffice) -> OrganisationOut:
    """Change what the organisation does, or which rulebooks it keeps. The brand kit and branch
    contact details are always kept, and a rulebook brings the ones it depends on with it."""
    db = get_db()
    current = db.table("organisations").select(ORG_COLUMNS).eq("id", user.org_id).single().execute().data
    changes: dict = {}
    if body.industry_group is not None or body.industry is not None or body.org_type is not None or body.focus is not None:
        changes |= _profile(
            body.industry_group if body.industry_group is not None else current["industry_group"],
            body.industry if body.industry is not None else current["industry"],
            body.org_type if body.org_type is not None else current["org_type"],
            body.focus if body.focus is not None else current["focus"] or [],
        )
    if body.rulebooks is not None:
        try:
            changes["rulebooks"] = check_rulebooks(body.rulebooks)
        except ProfileError as exc:
            raise HTTPException(400, str(exc)) from None
    if not changes:
        return OrganisationOut(**{**current, "rulebooks": complete(current["rulebooks"] or [])})

    row = db.table("organisations").update(changes).eq("id", user.org_id).execute().data[0]
    before = {k: current.get(k) for k in changes}
    audit(user.org_id, user.id, "organisation_updated", "organisation", user.org_id, {"before": before, "after": changes})
    return OrganisationOut(**{**current, **row, "rulebooks": complete(row["rulebooks"] or [])})
