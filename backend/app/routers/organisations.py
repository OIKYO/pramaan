"""Signing up a new organisation. Whoever signs up becomes its head office and can then set up the
rulebook, branches and team. Everything they add is visible only inside their organisation."""

import logging

from fastapi import APIRouter, HTTPException

from app.db import audit, get_db
from app.models import SignupRequest, SignupResult
from app.team import add_profile, create_login
from rules.registry import load_rule_pack

log = logging.getLogger(__name__)
router = APIRouter(tags=["organisations"])


@router.post("/signup", response_model=SignupResult, status_code=201)
def signup(body: SignupRequest) -> SignupResult:
    """Create an organisation and its first head office account. No sign-in needed."""
    db = get_db()
    name, full_name, email = body.organisation_name.strip(), body.full_name.strip(), body.email.strip().lower()
    user_id = create_login(db, email, body.password, full_name)
    org_id = None
    try:
        org_id = db.table("organisations").insert({"name": name, "created_by": user_id}).execute().data[0]["id"]
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
    audit(org_id, user_id, "organisation_created", "organisation", org_id, {"name": name})
    return SignupResult(org_id=org_id, user_id=user_id, email=email)
