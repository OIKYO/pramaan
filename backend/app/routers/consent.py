from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from app import consent, state
from app.auth import require
from app.db import audit, get_db
from app.invites import new_token, token_hash
from app.models import (ConsentApprove, ConsentDecline, ConsentPage, ConsentRequestCreate, ConsentRequestCreated,
                        ConsentRequestOut, ConsentWithdraw, PosterReading, Profile, Topper)
from app.ratelimit import limit
from app.routers.posters import load_state
from pipeline.pages import unstack_box
from pipeline.run import IST
from rules.claims import consent_problems
from rules.registry import rule_def
from rules.text import norm

router = APIRouter(tags=["consent"])
HeadOffice = Annotated[Profile, Depends(require("head_office"))]
IMAGE_SECONDS = 600
CONSENT_RULES = ("CCPA-02", "CCPA-03")


def _now() -> datetime:
    return datetime.now(IST)


def _topper(topper_id: str, org_id: str) -> Topper:
    rows = get_db().table("toppers").select("*").eq("id", topper_id).eq("org_id", org_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "That person isn't in the register.")
    return Topper(**rows[0])


def _out(row: dict, now: datetime) -> ConsentRequestOut:
    return ConsentRequestOut(
        id=row["id"], topper_id=row["topper_id"], topper_name=(row.get("toppers") or {}).get("full_name", ""),
        poster_id=row["poster_id"], poster_title=(row.get("posters") or {}).get("title"), channels=row["channels"],
        valid_until=row["valid_until"], status=consent.request_status(row, now), signer_name=row["signer_name"],
        signer_relation=row["signer_relation"], decline_reason=row["decline_reason"], decided_at=row["decided_at"],
        withdrawn_at=row["withdrawn_at"], expires_at=row["expires_at"], created_at=row["created_at"],
        created_by_name=(row.get("profiles") or {}).get("full_name"),
    )


LIST_COLUMNS = "*, toppers(full_name), posters(title), profiles(full_name)"



@router.post("/consent-requests", response_model=ConsentRequestCreated, status_code=201)
def create_request(body: ConsentRequestCreate, user: HeadOffice) -> ConsentRequestCreated:
    """A link for one person. From a poster, it shows that exact version and what it says about them."""
    db, now = get_db(), _now()
    topper = _topper(body.topper_id, user.org_id)
    problem = consent.valid_until_problem(body.valid_until, now.date())
    if problem:
        raise HTTPException(422, problem)
    poster_id, box, shown = None, None, []
    if body.version_id:
        rows = (db.table("poster_versions").select("id, poster_id, reading, posters!inner(org_id)")
                .eq("id", body.version_id).eq("posters.org_id", user.org_id).limit(1).execute().data)
        if not rows:
            raise HTTPException(404, "That poster version isn't in your organisation.")
        poster_id = rows[0]["poster_id"]
        reading = PosterReading.model_validate(rows[0]["reading"]) if rows[0]["reading"] else None
        box, shown = consent.find_on_poster(reading, topper)
    if not shown:
        course = (db.table("courses").select("name").eq("id", topper.course_id).execute().data
                  if topper.course_id else [])
        shown = consent.register_lines(topper, course[0]["name"] if course else None)
    token = new_token()
    row = db.table("consent_requests").insert({
        "org_id": user.org_id, "topper_id": topper.id, "poster_id": poster_id, "version_id": body.version_id,
        "token_hash": token_hash(token), "channels": body.channels, "valid_until": body.valid_until.isoformat(),
        "details": {"box_2d": box, "shown": shown}, "expires_at": consent.expires_at(now).isoformat(),
        "created_by": user.id,
    }).execute().data[0]
    audit(user.org_id, user.id, "consent_link_created", "topper", topper.id,
          {"name": topper.full_name, "poster_id": poster_id, "channels": body.channels, "request_id": row["id"]})
    full = db.table("consent_requests").select(LIST_COLUMNS).eq("id", row["id"]).single().execute().data
    return ConsentRequestCreated(request=_out(full, now), token=token)


@router.get("/consent-requests", response_model=list[ConsentRequestOut])
def list_requests(user: HeadOffice, topper_id: str | None = None) -> list[ConsentRequestOut]:
    query = get_db().table("consent_requests").select(LIST_COLUMNS).eq("org_id", user.org_id)
    if topper_id:
        query = query.eq("topper_id", topper_id)
    now = _now()
    return [_out(r, now) for r in query.order("created_at", desc=True).limit(200).execute().data]


@router.post("/consent-requests/{request_id}/revoke", response_model=ConsentRequestOut)
def revoke_request(request_id: str, user: HeadOffice) -> ConsentRequestOut:
    db, now = get_db(), _now()
    rows = db.table("consent_requests").select(LIST_COLUMNS).eq("id", request_id).eq("org_id", user.org_id).execute().data
    if not rows:
        raise HTTPException(404, "That consent link doesn't exist.")
    if consent.request_status(rows[0], now) != "pending":
        raise HTTPException(409, "Only a link nobody has answered yet can be cancelled.")
    db.table("consent_requests").update({"status": "revoked"}).eq("id", request_id).execute()
    audit(user.org_id, user.id, "consent_link_revoked", "topper", rows[0]["topper_id"], {"request_id": request_id})
    return _out({**rows[0], "status": "revoked"}, now)



def _by_token(token: str) -> dict:
    rows = (get_db().table("consent_requests").select("*, organisations(name), toppers(*), posters(title)")
            .eq("token_hash", token_hash(token)).limit(1).execute().data)
    if not rows:
        raise HTTPException(404, "This consent link doesn't exist. Ask the institute for a new one.")
    return rows[0]


def _page(row: dict) -> ConsentPage:
    details = row.get("details") or {}
    image_url, box = None, details.get("box_2d")
    if row["version_id"]:
        version = get_db().table("poster_versions").select("image_path, pages").eq("id", row["version_id"]).execute().data
        if version:
            path, stored = version[0]["image_path"], version[0].get("pages") or []
            if box:
                page, box = unstack_box(box)
                if page < len(stored) and stored[page].get("image_path"):
                    path = stored[page]["image_path"]
            signed = get_db().storage.from_("posters").create_signed_url(path, IMAGE_SECONDS)
            image_url = signed.get("signedURL") or signed.get("signedUrl")
    return ConsentPage(
        organisation=row["organisations"]["name"], person_name=row["toppers"]["full_name"],
        is_minor=row["toppers"]["is_minor"], status=consent.request_status(row, _now()), channels=row["channels"],
        valid_until=row["valid_until"], poster_title=(row.get("posters") or {}).get("title"), image_url=image_url,
        box_2d=box, shown=details.get("shown") or [row["toppers"]["full_name"]],
        signer_name=row["signer_name"], signer_relation=row["signer_relation"], decided_at=row["decided_at"],
        withdrawn_at=row["withdrawn_at"], expires_at=row["expires_at"],
    )


def _must_be(row: dict, wanted: str, message: str) -> None:
    if consent.request_status(row, _now()) != wanted:
        raise HTTPException(409, message)


@router.get("/consent/{token}", response_model=ConsentPage)
def view(token: str, request: Request) -> ConsentPage:
    """The consent page. No sign-in needed: the link itself is the key."""
    limit(request, "consent", attempts=60)
    return _page(_by_token(token))


@router.post("/consent/{token}/approve", response_model=ConsentPage)
def approve(token: str, body: ConsentApprove, request: Request) -> ConsentPage:
    limit(request, "consent", attempts=60)
    row = _by_token(token)
    _must_be(row, "pending", "This link has already been answered, or it has expired. Ask the institute for a new one.")
    topper = Topper(**row["toppers"])
    problem = consent.relation_problem(topper, body.relation)
    if problem:
        raise HTTPException(422, problem)
    db, now = get_db(), _now()
    signer = body.signer_name.strip()
    db.table("consent_requests").update({"status": "approved", "signer_name": signer, "signer_relation": body.relation,
                                         "decided_at": now.isoformat()}).eq("id", row["id"]).execute()
    given = consent.approved_topper(topper, row["channels"], date.fromisoformat(row["valid_until"]),
                                    body.relation, now.date())
    db.table("toppers").update({
        "consent_source": "link", "consent_date": now.date().isoformat(), "consent_channels": row["channels"],
        "consent_valid_until": row["valid_until"], "guardian_signed": body.relation == "guardian",
        "consent_withdrawn_at": None,
    }).eq("id", topper.id).execute()
    audit(row["org_id"], None, "consent_approved", "topper", topper.id,
          {"name": topper.full_name, "signer": signer, "relation": body.relation, "channels": row["channels"],
           "valid_until": row["valid_until"], "request_id": row["id"]})
    _clear_covered_findings(row["org_id"], given, f"Consent given through the consent link by "
                                                  f"{consent.signer_words(signer, body.relation)} on {now:%d %b %Y}.")
    return _page(_by_token(token))


@router.post("/consent/{token}/decline", response_model=ConsentPage)
def decline(token: str, body: ConsentDecline, request: Request) -> ConsentPage:
    limit(request, "consent", attempts=60)
    row = _by_token(token)
    _must_be(row, "pending", "This link has already been answered, or it has expired.")
    now = _now()
    get_db().table("consent_requests").update({"status": "declined", "decline_reason": (body.reason or "").strip() or None,
                                               "decided_at": now.isoformat()}).eq("id", row["id"]).execute()
    audit(row["org_id"], None, "consent_declined", "topper", row["topper_id"],
          {"name": row["toppers"]["full_name"], "request_id": row["id"]})
    return _page(_by_token(token))


@router.post("/consent/{token}/withdraw", response_model=ConsentPage)
def withdraw(token: str, body: ConsentWithdraw, request: Request) -> ConsentPage:
    limit(request, "consent", attempts=60)
    row = _by_token(token)
    _must_be(row, "approved", "Only consent that was given can be withdrawn.")
    db, now = get_db(), _now()
    signer = body.signer_name.strip()
    db.table("consent_requests").update({"status": "withdrawn", "withdrawn_at": now.isoformat()}).eq("id", row["id"]).execute()
    db.table("toppers").update({"consent_source": None, "consent_withdrawn_at": now.isoformat()}).eq("id", row["topper_id"]).execute()
    audit(row["org_id"], None, "consent_withdrawn", "topper", row["topper_id"],
          {"name": row["toppers"]["full_name"], "signer": signer, "request_id": row["id"]})
    topper = Topper(**{**row["toppers"], "consent_source": None, "has_consent": False, "consent_withdrawn_at": now})
    who = (f"{topper.full_name} withdrew consent" if norm(signer) == norm(topper.full_name)
           else f"{signer} withdrew {topper.full_name}'s consent")
    _reopen_posters(row["org_id"], topper, f"{who} on {now:%d %b %Y}.")
    return _page(_by_token(token))



def _current_versions(org_id: str) -> dict[str, dict]:
    rows = (get_db().table("poster_versions")
            .select("id, poster_id, version, reading, tagged_topper_ids, posters!inner(org_id, channel, status, current_version)")
            .eq("posters.org_id", org_id).execute().data)
    return {r["id"]: r for r in rows if r["version"] == r["posters"]["current_version"]}


def _clear_covered_findings(org_id: str, topper: Topper, note: str) -> None:
    db, now = get_db(), _now()
    versions = _current_versions(org_id)
    rows = (db.table("findings").select("id, version_id, rule_id").in_("rule_id", list(CONSENT_RULES))
            .eq("status", "open").eq("evidence->>topper_id", topper.id).execute().data)
    for finding in rows:
        version = versions.get(finding["version_id"])
        if not version or version["posters"]["status"] == "approved":
            continue
        if consent_problems(topper, version["posters"]["channel"], now.date()):
            continue
        db.table("findings").update({"status": "resolved", "override_reason": note, "resolved_at": now.isoformat()}
                                    ).eq("id", finding["id"]).execute()
        db.table("reviews").insert({"poster_id": version["poster_id"], "version_id": version["id"], "actor_id": None,
                                    "action": "finding_resolved", "comment": f"{finding['rule_id']}: {note}"}).execute()
        audit(org_id, None, "finding_resolved", "finding", finding["id"],
              {"rule_id": finding["rule_id"], "poster_id": version["poster_id"], "note": note})


def _reopen_posters(org_id: str, topper: Topper, note: str) -> None:
    db = get_db()
    versions = _current_versions(org_id)
    flagged = {f["version_id"]: f for f in (db.table("findings").select("version_id, evidence")
                                            .eq("evidence->>topper_id", topper.id).execute().data)}
    reason = rule_def("CCPA-02").reason
    for version in versions.values():
        if topper.id not in (version["tagged_topper_ids"] or []) and version["id"] not in flagged:
            continue
        reading = PosterReading.model_validate(version["reading"]) if version["reading"] else None
        box, _ = consent.find_on_poster(reading, topper)
        box = box or (flagged.get(version["id"], {}).get("evidence") or {}).get("box_2d")
        finding = {"kind": "code", "severity": "block", "status": "open", "message": note, "reason": reason,
                   "evidence": {"box_2d": box, "text": topper.full_name, "topper_id": topper.id},
                   "suggested_fix": f"Remove {topper.full_name} from the poster, and take it down wherever it was published."}
        passed = (db.table("findings").select("id").eq("version_id", version["id"]).eq("rule_id", "CCPA-02")
                  .eq("severity", "pass").limit(1).execute().data)
        if passed:
            db.table("findings").update(finding).eq("id", passed[0]["id"]).execute()
        else:
            db.table("findings").insert({**finding, "version_id": version["id"], "rule_id": "CCPA-02"}).execute()
        poster = load_state(version["poster_id"])
        move = state.consent_withdrawn(poster)
        if move:
            db.table("posters").update({"status": move.status, "review_stage": move.review_stage}).eq("id", poster.id).execute()
            db.table("reviews").insert({"poster_id": poster.id, "version_id": version["id"], "actor_id": None,
                                        "action": move.action, "comment": note}).execute()
            audit(org_id, None, f"poster_{move.action}", "poster", poster.id,
                  {"from": poster.status, "to": move.status, "topper_id": topper.id})
