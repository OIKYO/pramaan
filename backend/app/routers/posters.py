import io
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app import state
from app.auth import current_user
from app.config import get_settings
from app.db import audit, get_db
from app.models import (
    Channel, FindingOut, PosterDetail, PosterReading, Profile, ReviewOut, ReviewRequest, VersionOut,
)
from pipeline.reader import AI_RULE_IDS
from pipeline.run import CheckResult, PosterInput, cached_reading, check_poster, image_sha256, load_reference, save_result
from rules.registry import Problem, to_finding

log = logging.getLogger(__name__)
router = APIRouter(prefix="/posters", tags=["posters"])

MAX_IMAGE_BYTES = 15 * 1024 * 1024
FORMATS = {"PNG": ("image/png", "png"), "JPEG": ("image/jpeg", "jpg"), "WEBP": ("image/webp", "webp")}
SIGNED_URL_SECONDS = 3600
SEVERITY_ORDER = {"block": 0, "needs_human": 1, "warn": 2, "pass": 3}


def load_state(poster_id: str) -> state.PosterState:
    rows = get_db().table("posters").select("*, branches(region_id)").eq("id", poster_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Poster not found.")
    p = rows[0]
    return state.PosterState(id=p["id"], org_id=p["org_id"], branch_id=p["branch_id"], region_id=p["branches"]["region_id"],
                             created_by=p["created_by"], status=p["status"], review_stage=p["review_stage"])


def current_version_id(poster_id: str) -> str:
    db = get_db()
    poster = db.table("posters").select("current_version").eq("id", poster_id).single().execute().data
    return (db.table("poster_versions").select("id").eq("poster_id", poster_id)
            .eq("version", poster["current_version"]).single().execute().data["id"])


def finding_states(version_id: str) -> list[state.FindingState]:
    rows = get_db().table("findings").select("id, severity, status").eq("version_id", version_id).execute().data
    return [state.FindingState(**r) for r in rows]


def apply(poster: state.PosterState, transition: state.Transition, actor: Profile, *, version_id: str | None = None,
          comment: str | None = None, details: dict | None = None) -> None:
    db = get_db()
    db.table("posters").update({"status": transition.status, "review_stage": transition.review_stage}).eq("id", poster.id).execute()
    db.table("reviews").insert({"poster_id": poster.id, "version_id": version_id, "actor_id": actor.id,
                                "action": transition.action, "comment": comment}).execute()
    audit(poster.org_id, actor.id, f"poster_{transition.action}", "poster", poster.id,
          {"from": poster.status, "to": transition.status, "review_stage": transition.review_stage, **(details or {})})


def refuse(error: state.Refused) -> HTTPException:
    return HTTPException(error.status, error.message)


def build_detail(poster_id: str, user: Profile) -> PosterDetail:
    db = get_db()
    ps = load_state(poster_id)
    if not state.can_view(user, ps):
        raise HTTPException(404, "Poster not found. It may belong to a branch outside your area.")
    p = (db.table("posters").select("*, branches(name), profiles(full_name)").eq("id", poster_id).single().execute().data)
    versions = db.table("poster_versions").select("*").eq("poster_id", poster_id).order("version").execute().data
    ids = [v["id"] for v in versions]
    findings = db.table("findings").select("*").in_("version_id", ids).execute().data if ids else []
    reviews = (db.table("reviews").select("*, profiles(full_name)").eq("poster_id", poster_id)
               .order("created_at").execute().data)
    urls = {}
    if versions:
        signed = db.storage.from_("posters").create_signed_urls([v["image_path"] for v in versions], SIGNED_URL_SECONDS)
        urls = {s["path"]: s.get("signedURL") or s.get("signedUrl") for s in signed}

    version_out = []
    for v in versions:
        reading = PosterReading.model_validate(v["reading"]) if v["reading"] else None
        mine = sorted((f for f in findings if f["version_id"] == v["id"]),
                      key=lambda f: (SEVERITY_ORDER[f["severity"]], f["rule_id"]))
        version_out.append(VersionOut(
            id=v["id"], version=v["version"], image_url=urls.get(v["image_path"]), image_sha256=v["image_sha256"],
            caption=v["caption"], alt_text=v["alt_text"], tagged_topper_ids=v["tagged_topper_ids"],
            reading=reading, reader_model=v["reader_model"], checked_at=v["checked_at"], created_at=v["created_at"],
            findings=[FindingOut(**f) for f in mine],
            questions=[q for q in (reading.wording_flags if reading else []) if q.rule_id not in AI_RULE_IDS],
        ))
    current = next((v for v in versions if v["version"] == p["current_version"]), None)
    current_findings = finding_states(current["id"]) if current else []
    return PosterDetail(
        id=p["id"], title=p["title"], channel=p["channel"], status=p["status"], review_stage=p["review_stage"],
        current_version=p["current_version"], branch_id=p["branch_id"], branch_name=p["branches"]["name"],
        created_by=p["created_by"], created_by_name=p["profiles"]["full_name"], created_at=p["created_at"],
        updated_at=p["updated_at"], versions=version_out,
        reviews=[ReviewOut(id=r["id"], version_id=r["version_id"], actor_id=r["actor_id"],
                           actor_name=(r["profiles"] or {}).get("full_name") or "Consent link", action=r["action"], comment=r["comment"],
                           created_at=r["created_at"]) for r in reviews],
        allowed_actions=state.allowed_actions(user, ps, current_findings),
    )


def read_image(upload: UploadFile) -> tuple[bytes, str, str]:
    data = upload.file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "The image is larger than 15 MB. Export it smaller and try again.")
    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = img.format
            img.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(415, "That file isn't an image Pramaan can read. Upload a PNG, JPEG or WebP.") from None
    if fmt not in FORMATS:
        raise HTTPException(415, f"{fmt} images aren't supported. Upload a PNG, JPEG or WebP.")
    mime, ext = FORMATS[fmt]
    return data, mime, ext


def valid_tags(tagged: list[str], org_id: str) -> list[str]:
    ids = [t for t in (tag.strip() for tag in tagged) if t]
    if ids:
        known = {r["id"] for r in get_db().table("toppers").select("id").in_("id", ids).eq("org_id", org_id).execute().data}
        if unknown := set(ids) - known:
            raise HTTPException(422, f"{len(unknown)} tagged student(s) aren't in the toppers register. Refresh and tag again.")
    return ids


def add_version(poster: state.PosterState, version: int, data: bytes, mime: str, ext: str, filename: str,
                caption: str, alt_text: str, tags: list[str], actor: Profile) -> str:
    db = get_db()
    sha = image_sha256(data)
    path = f"{poster.id}/v{version}-{sha[:12]}.{ext}"
    db.storage.from_("posters").upload(path, data, {"content-type": mime, "upsert": "true"})
    version_id = db.table("poster_versions").insert({
        "poster_id": poster.id, "version": version, "image_path": path, "image_sha256": sha,
        "caption": caption, "alt_text": alt_text, "tagged_topper_ids": tags,
    }).execute().data[0]["id"]

    settings = get_settings()
    try:
        ref = load_reference(db, poster.branch_id, poster.org_id)
        cached = cached_reading(db, sha, caption, settings.reader_mode == "live", poster.org_id)
        result = check_poster(PosterInput(image=data, mime_type=mime, channel=_channel(poster.id), caption=caption,
                                          alt_text=alt_text, tagged_topper_ids=tags, filename=filename),
                              ref, settings, cached=cached)
    except Exception as exc:  # never leave a poster stuck in draft
        log.exception("Checks crashed for poster %s v%s", poster.id, version)
        result = CheckResult(sha, None, None, [to_finding("READ-01", Problem(
            "The checks crashed before finishing, so this version wasn't fully checked.",
            {"error": f"{type(exc).__name__}: {str(exc)[:300]}"},
            "Upload the version again. If it keeps failing, tell the Pramaan team."))])
    save_result(db, version_id, result, actor.id, poster.org_id)
    counts = {s: sum(f.severity == s for f in result.findings) for s in ("block", "needs_human", "warn", "pass")}
    apply(poster, state.checked(), actor, version_id=version_id,
          details={"version": version, "reader_model": result.reader_model, "findings": counts})
    return version_id


def _channel(poster_id: str) -> str:
    return get_db().table("posters").select("channel").eq("id", poster_id).single().execute().data["channel"]


Tags = Annotated[list[str], Form()]


@router.post("", response_model=PosterDetail, status_code=201)
def create_poster(
    user: Annotated[Profile, Depends(current_user)],
    image: Annotated[UploadFile, File()],
    title: Annotated[str, Form(min_length=1, max_length=200)],
    channel: Annotated[Channel, Form()],
    caption: Annotated[str, Form(max_length=2200)] = "",
    alt_text: Annotated[str, Form(max_length=1000)] = "",
    tagged_topper_ids: Tags = [],
) -> PosterDetail:
    """Branch staff upload a poster: creates the poster and version 1, and runs the checks."""
    try:
        state.check_create(user)
    except state.Refused as error:
        raise refuse(error) from None
    data, mime, ext = read_image(image)
    tags = valid_tags(tagged_topper_ids, user.org_id)
    db = get_db()
    row = db.table("posters").insert({
        "org_id": user.org_id, "branch_id": user.branch_id, "created_by": user.id, "title": title.strip(), "channel": channel,
        "status": "draft", "current_version": 1,
    }).execute().data[0]
    db.table("reviews").insert({"poster_id": row["id"], "actor_id": user.id, "action": "created"}).execute()
    audit(user.org_id, user.id, "poster_created", "poster", row["id"], {"title": row["title"], "channel": channel})
    poster = load_state(row["id"])
    add_version(poster, 1, data, mime, ext, image.filename or "", caption, alt_text, tags, user)
    return build_detail(row["id"], user)


@router.post("/{poster_id}/versions", response_model=PosterDetail, status_code=201)
def new_version(
    poster_id: str,
    user: Annotated[Profile, Depends(current_user)],
    image: Annotated[UploadFile, File()],
    caption: Annotated[str, Form(max_length=2200)] = "",
    alt_text: Annotated[str, Form(max_length=1000)] = "",
    tagged_topper_ids: Tags = [],
) -> PosterDetail:
    """A fixed version, allowed when the poster is checked or was sent back. Runs the checks again."""
    poster = load_state(poster_id)
    try:
        transition = state.check_new_version(user, poster)
    except state.Refused as error:
        raise refuse(error) from None
    data, mime, ext = read_image(image)
    tags = valid_tags(tagged_topper_ids, user.org_id)
    db = get_db()
    version = db.table("posters").select("current_version").eq("id", poster_id).single().execute().data["current_version"] + 1
    db.table("posters").update({"current_version": version}).eq("id", poster_id).execute()
    apply(poster, transition, user, details={"version": version})
    add_version(load_state(poster_id), version, data, mime, ext, image.filename or "", caption, alt_text, tags, user)
    return build_detail(poster_id, user)


@router.post("/{poster_id}/submit", response_model=PosterDetail)
def submit(poster_id: str, user: Annotated[Profile, Depends(current_user)]) -> PosterDetail:
    poster = load_state(poster_id)
    try:
        transition = state.submit(user, poster)
    except state.Refused as error:
        raise refuse(error) from None
    apply(poster, transition, user, version_id=current_version_id(poster_id))
    return build_detail(poster_id, user)


@router.post("/{poster_id}/review", response_model=PosterDetail)
def review(poster_id: str, body: ReviewRequest, user: Annotated[Profile, Depends(current_user)]) -> PosterDetail:
    """Regional manager or head office: approve, or send back with a comment."""
    poster = load_state(poster_id)
    version_id = current_version_id(poster_id)
    try:
        transition = state.review(user, poster, body.action, finding_states(version_id), body.comment)
    except state.Refused as error:
        raise refuse(error) from None
    apply(poster, transition, user, version_id=version_id, comment=(body.comment or "").strip() or None)
    return build_detail(poster_id, user)


@router.get("/{poster_id}", response_model=PosterDetail)
def detail(poster_id: str, user: Annotated[Profile, Depends(current_user)]) -> PosterDetail:
    """Versions, findings, reviews and signed image URLs, plus what this user may do next."""
    return build_detail(poster_id, user)
