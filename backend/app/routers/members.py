from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require
from app.db import audit, get_db
from app.demo import not_in_demo
from app.models import MemberCreate, MemberCreated, MemberOut, MemberUpdate, Profile
from app.team import add_profile, create_login, placement, temporary_password
from pipeline.run import IST

router = APIRouter(prefix="/members", tags=["team"])
HeadOffice = Annotated[Profile, Depends(require("head_office"))]
FOREVER = "876000h"  # Supabase bans by duration; 100 years


def _member(member_id: str, org_id: str) -> dict:
    rows = get_db().table("profiles").select("*").eq("id", member_id).eq("org_id", org_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "That person isn't in your organisation.")
    return rows[0]


def _active_head_offices(org_id: str) -> int:
    return len(get_db().table("profiles").select("id").eq("org_id", org_id).eq("role", "head_office")
               .is_("deactivated_at", "null").execute().data)


@router.post("", response_model=MemberCreated, status_code=201)
def add_member(body: MemberCreate, user: HeadOffice) -> MemberCreated:
    not_in_demo(user.org_id, "managing the team")
    db = get_db()
    branch_id, region_id = placement(db, user.org_id, body.role, body.branch_id, body.region_id)
    email, password = body.email.strip().lower(), temporary_password()
    user_id = create_login(db, email, password, body.full_name.strip())
    row = add_profile(db, user_id, user.org_id, body.full_name.strip(), email, body.role, branch_id, region_id,
                      needs_password_change=True)
    audit(user.org_id, user.id, "member_added", "profile", user_id, {"email": email, "role": body.role})
    return MemberCreated(member=MemberOut(**row), temporary_password=password)


@router.patch("/{member_id}", response_model=MemberOut)
def update_member(member_id: str, body: MemberUpdate, user: HeadOffice) -> MemberOut:
    not_in_demo(user.org_id, "managing the team")
    db = get_db()
    member = _member(member_id, user.org_id)
    role = body.role or member["role"]
    if member["role"] == "head_office" and role != "head_office" and _active_head_offices(user.org_id) <= 1:
        raise HTTPException(409, "Your organisation needs at least one head office account. Add another first.")
    branch_id, region_id = placement(db, user.org_id, role, body.branch_id or member["branch_id"],
                                     body.region_id or member["region_id"])
    changes = {"role": role, "branch_id": branch_id, "region_id": region_id}
    if body.full_name:
        changes["full_name"] = body.full_name.strip()
    row = db.table("profiles").update(changes).eq("id", member_id).execute().data[0]
    audit(user.org_id, user.id, "member_changed", "profile", member_id, {"email": member["email"], **changes})
    return MemberOut(**row)


@router.post("/{member_id}/reset-password", response_model=MemberCreated)
def reset_password(member_id: str, user: HeadOffice) -> MemberCreated:
    """A new temporary password, for someone who forgot theirs."""
    not_in_demo(user.org_id, "managing the team")
    db = get_db()
    member = _member(member_id, user.org_id)
    password = temporary_password()
    db.auth.admin.update_user_by_id(member_id, {"password": password})
    row = db.table("profiles").update({"needs_password_change": True}).eq("id", member_id).execute().data[0]
    audit(user.org_id, user.id, "member_password_reset", "profile", member_id, {"email": member["email"]})
    return MemberCreated(member=MemberOut(**row), temporary_password=password)


@router.post("/{member_id}/deactivate", response_model=MemberOut)
def deactivate(member_id: str, user: HeadOffice) -> MemberOut:
    """Remove someone's access at once. Their posters and history stay, so the audit trail is intact."""
    not_in_demo(user.org_id, "managing the team")
    if member_id == user.id:
        raise HTTPException(409, "You can't remove your own access. Ask another head office account.")
    db = get_db()
    member = _member(member_id, user.org_id)
    db.auth.admin.update_user_by_id(member_id, {"ban_duration": FOREVER})
    row = (db.table("profiles").update({"deactivated_at": datetime.now(IST).isoformat()})
           .eq("id", member_id).execute().data[0])
    audit(user.org_id, user.id, "member_removed", "profile", member_id, {"email": member["email"]})
    return MemberOut(**row)


@router.post("/{member_id}/reactivate", response_model=MemberOut)
def reactivate(member_id: str, user: HeadOffice) -> MemberOut:
    not_in_demo(user.org_id, "managing the team")
    db = get_db()
    member = _member(member_id, user.org_id)
    db.auth.admin.update_user_by_id(member_id, {"ban_duration": "none"})
    row = db.table("profiles").update({"deactivated_at": None}).eq("id", member_id).execute().data[0]
    audit(user.org_id, user.id, "member_restored", "profile", member_id, {"email": member["email"]})
    return MemberOut(**row)
