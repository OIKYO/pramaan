from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app import invites as rules
from app.auth import require
from app.db import audit, get_db
from app.demo import not_in_demo
from app.models import (
    BranchChoice, CodePreview, InviteCreate, InviteCreated, InviteOut, InvitePreview, JoinCode, JoinResult, JoinWithCode,
    JoinWithInvite, Profile,
)
from app.ratelimit import limit
from app.team import add_profile, create_login, placement

router = APIRouter(tags=["invites"])
Inviter = Annotated[Profile, Depends(require("head_office", "regional_manager"))]
HeadOffice = Annotated[Profile, Depends(require("head_office"))]
INVITE_COLUMNS = "id, org_id, role, branch_id, region_id, email, created_by, created_at, expires_at, used_at, revoked_at"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _out(row: dict, names: dict[str, str]) -> InviteOut:
    return InviteOut(**{k: row[k] for k in ("id", "role", "branch_id", "region_id", "email", "created_at", "expires_at")},
                     created_by_name=names.get(row["created_by"] or ""), status=rules.invite_status(row, _now()))


def _names(org_id: str) -> dict[str, str]:
    return {p["id"]: p["full_name"] for p in get_db().table("profiles").select("id, full_name").eq("org_id", org_id).execute().data}


def _branch_region(org_id: str, branch_id: str | None) -> str | None:
    if not branch_id:
        return None
    rows = get_db().table("branches").select("region_id").eq("id", branch_id).eq("org_id", org_id).execute().data
    return rows[0]["region_id"] if rows else None


@router.post("/invites", response_model=InviteCreated, status_code=201)
def create_invite(body: InviteCreate, user: Inviter) -> InviteCreated:
    """A single-use link for one person, valid for 7 days. The link itself is shown only now."""
    not_in_demo(user.org_id, "inviting people")
    db = get_db()
    branch_id, region_id = placement(db, user.org_id, body.role, body.branch_id, body.region_id)
    if problem := rules.invite_problem(user.role, user.region_id, body.role, _branch_region(user.org_id, branch_id)):
        raise HTTPException(403, problem)
    token = rules.new_token()
    row = db.table("invites").insert({
        "org_id": user.org_id, "token_hash": rules.token_hash(token), "role": body.role, "branch_id": branch_id,
        "region_id": region_id, "email": body.email.strip().lower() if body.email else None, "created_by": user.id,
        "expires_at": rules.expiry(_now()).isoformat(),
    }).execute().data[0]
    audit(user.org_id, user.id, "invite_created", "invite", row["id"], {"role": body.role, "branch_id": branch_id, "region_id": region_id})
    return InviteCreated(invite=_out(row, {user.id: user.full_name}), token=token)


@router.get("/invites", response_model=list[InviteOut])
def list_invites(user: Inviter) -> list[InviteOut]:
    """Invites still waiting to be used. Regional managers see the ones for their region."""
    rows = (get_db().table("invites").select(INVITE_COLUMNS).eq("org_id", user.org_id)
            .is_("used_at", "null").is_("revoked_at", "null").order("created_at", desc=True).execute().data)
    if user.role == "regional_manager":
        rows = [r for r in rows if r["created_by"] == user.id or _branch_region(user.org_id, r["branch_id"]) == user.region_id]
    names = _names(user.org_id)
    return [o for o in (_out(r, names) for r in rows) if o.status == "pending"]


@router.post("/invites/{invite_id}/revoke", response_model=InviteOut)
def revoke_invite(invite_id: str, user: Inviter) -> InviteOut:
    db = get_db()
    rows = db.table("invites").select(INVITE_COLUMNS).eq("id", invite_id).eq("org_id", user.org_id).execute().data
    if not rows:
        raise HTTPException(404, "That invite doesn't exist.")
    if user.role == "regional_manager" and rows[0]["created_by"] != user.id and \
            _branch_region(user.org_id, rows[0]["branch_id"]) != user.region_id:
        raise HTTPException(403, "You can cancel invites for your own region only.")
    row = db.table("invites").update({"revoked_at": _now().isoformat()}).eq("id", invite_id).execute().data[0]
    audit(user.org_id, user.id, "invite_revoked", "invite", invite_id)
    return _out(row, _names(user.org_id))


def _invite_by_token(token: str) -> dict:
    rows = get_db().table("invites").select(f"{INVITE_COLUMNS}, organisations(name)").eq(
        "token_hash", rules.token_hash(token)).execute().data
    if not rows:
        raise HTTPException(404, "This invite link isn't valid. Ask for a new one.")
    status = rules.invite_status(rows[0], _now())
    if status != "pending":
        raise HTTPException(410, {"used": "This invite has already been used. Sign in instead.",
                                  "revoked": "This invite was cancelled. Ask for a new one.",
                                  "expired": "This invite has expired. Ask for a new one."}[status])
    return rows[0]


def _place_names(row: dict) -> tuple[str | None, str | None]:
    db = get_db()
    branch = db.table("branches").select("name").eq("id", row["branch_id"]).execute().data if row["branch_id"] else []
    region = db.table("regions").select("name").eq("id", row["region_id"]).execute().data if row["region_id"] else []
    return (branch[0]["name"] if branch else None), (region[0]["name"] if region else None)


@router.get("/join/invite/{token}", response_model=InvitePreview)
def preview_invite(token: str, request: Request) -> InvitePreview:
    """What an invite is for, before the person accepts it. No sign-in needed."""
    limit(request, "join")
    row = _invite_by_token(token)
    branch, region = _place_names(row)
    inviter = get_db().table("profiles").select("full_name").eq("id", row["created_by"]).execute().data if row["created_by"] else []
    return InvitePreview(organisation=row["organisations"]["name"], role=row["role"], branch=branch, region=region,
                         invited_by=inviter[0]["full_name"] if inviter else None, email=row["email"], expires_at=row["expires_at"])


@router.post("/join/invite/{token}", response_model=JoinResult, status_code=201)
def accept_invite(token: str, body: JoinWithInvite, request: Request) -> JoinResult:
    """Create the person's account inside the organisation, with the invite's role and place."""
    limit(request, "join")
    row = _invite_by_token(token)
    not_in_demo(row["org_id"], "joining")
    email = body.email.strip().lower()
    if row["email"] and row["email"] != email:
        raise HTTPException(403, f"This invite is for {row['email']}. Use that email, or ask for a new invite.")
    db = get_db()
    user_id = create_login(db, email, body.password, body.full_name.strip())
    add_profile(db, user_id, row["org_id"], body.full_name.strip(), email, row["role"], row["branch_id"], row["region_id"],
                needs_password_change=False)
    db.table("invites").update({"used_at": _now().isoformat(), "used_by": user_id}).eq("id", row["id"]).execute()
    audit(row["org_id"], user_id, "joined_with_invite", "invite", row["id"], {"role": row["role"]})
    return JoinResult(email=email, organisation=row["organisations"]["name"])


def _org_by_code(code: str) -> dict:
    rows = get_db().table("organisations").select("id, name").eq("join_code", rules.normalise_code(code)).execute().data
    if not rows:
        raise HTTPException(404, "No organisation has that code. Check it with your manager.")
    return rows[0]


@router.get("/join/code/{code}", response_model=CodePreview)
def preview_code(code: str, request: Request) -> CodePreview:
    """The organisation a code belongs to, and its branches to choose from. No sign-in needed."""
    limit(request, "join")
    org = _org_by_code(code)
    branches = get_db().table("branches").select("id, name, city").eq("org_id", org["id"]).order("name").execute().data
    return CodePreview(organisation=org["name"], branches=[BranchChoice(**b) for b in branches])


@router.post("/join/code", response_model=JoinResult, status_code=201)
def join_with_code(body: JoinWithCode, request: Request) -> JoinResult:
    """Join as branch staff of the chosen branch. Head office can change the role later."""
    limit(request, "join")
    org = _org_by_code(body.code)
    not_in_demo(org["id"], "joining")
    db = get_db()
    branch_id, _ = placement(db, org["id"], "branch_staff", body.branch_id, None)
    email = body.email.strip().lower()
    user_id = create_login(db, email, body.password, body.full_name.strip())
    add_profile(db, user_id, org["id"], body.full_name.strip(), email, "branch_staff", branch_id, None, needs_password_change=False)
    audit(org["id"], user_id, "joined_with_code", "profile", user_id, {"branch_id": branch_id})
    return JoinResult(email=email, organisation=org["name"])


def _ensure_code(org_id: str) -> str:
    db = get_db()
    code = db.table("organisations").select("join_code").eq("id", org_id).single().execute().data["join_code"]
    if not code:
        code = rules.new_code()
        db.table("organisations").update({"join_code": code}).eq("id", org_id).execute()
    return code


@router.get("/organisation/join-code", response_model=JoinCode)
def get_join_code(user: Inviter) -> JoinCode:
    """The code people use to join while creating their account. Visible only inside the organisation."""
    return JoinCode(code=_ensure_code(user.org_id))


@router.post("/organisation/join-code", response_model=JoinCode)
def refresh_join_code(user: HeadOffice, response: Response) -> JoinCode:
    """Replace the code, for example if it was shared outside the organisation. The old one stops working."""
    not_in_demo(user.org_id, "replacing the join code")
    code = rules.new_code()
    get_db().table("organisations").update({"join_code": code}).eq("id", user.org_id).execute()
    audit(user.org_id, user.id, "join_code_refreshed", "organisation", user.org_id)
    response.headers["Cache-Control"] = "no-store"
    return JoinCode(code=code)
