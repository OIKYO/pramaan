"""Consent files never go to the AI, and no client can read their bucket directly."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse

from app import tickets
from app.auth import require
from app.config import get_settings
from app.db import audit, get_db
from app.models import ConsentFileLink, ConsentUploaded, ConsentUrl, Profile
from app.ratelimit import limit
from pipeline.run import IST

router = APIRouter(prefix="/toppers", tags=["toppers"])
MAX_PDF_BYTES = 10 * 1024 * 1024
URL_SECONDS = 120
LINK_SECONDS = 600
HeadOffice = Annotated[Profile, Depends(require("head_office"))]


def _topper(topper_id: str, org_id: str) -> dict:
    rows = (get_db().table("toppers").select("id, full_name, consent_path").eq("id", topper_id)
            .eq("org_id", org_id).limit(1).execute().data)
    if not rows:
        raise HTTPException(404, "That student isn't in the toppers register.")
    return rows[0]


@router.post("/{topper_id}/consent", response_model=ConsentUploaded)
def upload_consent(topper_id: str, user: HeadOffice, file: Annotated[UploadFile, File()]) -> ConsentUploaded:
    topper = _topper(topper_id, user.org_id)
    data = file.file.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(413, "The consent file is larger than 10 MB. Scan it at a lower resolution.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(415, "Consent must be a PDF. Scan or export the signed form as PDF.")
    path = f"{user.org_id}/{topper_id}/consent-{datetime.now(IST):%Y%m%d-%H%M%S}.pdf"
    db = get_db()
    db.storage.from_("consent").upload(path, data, {"content-type": "application/pdf", "upsert": "true"})
    db.table("toppers").update({"consent_path": path, "consent_source": "file", "consent_withdrawn_at": None, "verified_by": user.id,
                                "verified_at": datetime.now(IST).isoformat()}).eq("id", topper_id).execute()
    audit(user.org_id, user.id, "consent_uploaded", "topper", topper_id, {"name": topper["full_name"], "path": path})
    return ConsentUploaded(topper_id=topper_id, has_consent=True)


@router.get("/{topper_id}/consent-url", response_model=ConsentUrl)
def consent_url(topper_id: str, user: HeadOffice) -> ConsentUrl:
    topper = _topper(topper_id, user.org_id)
    if not topper["consent_path"]:
        raise HTTPException(404, f"There's no consent on file for {topper['full_name']}.")
    signed = get_db().storage.from_("consent").create_signed_url(topper["consent_path"], URL_SECONDS)
    audit(user.org_id, user.id, "consent_viewed", "topper", topper_id, {"name": topper["full_name"]})
    return ConsentUrl(url=signed.get("signedURL") or signed.get("signedUrl"), expires_in=URL_SECONDS)


@router.get("/{topper_id}/consent-link", response_model=ConsentFileLink)
def consent_link(topper_id: str, user: HeadOffice) -> ConsentFileLink:
    """A link to the consent file for 10 minutes, to put behind an ordinary link that opens a new tab."""
    topper = _topper(topper_id, user.org_id)
    if not topper["consent_path"]:
        raise HTTPException(404, f"There's no consent on file for {topper['full_name']}.")
    ticket = tickets.make(get_settings().supabase_secret_key, {"t": topper_id, "o": user.org_id, "u": user.id}, LINK_SECONDS)
    return ConsentFileLink(path=f"/toppers/consent-files/{ticket}", expires_in=LINK_SECONDS)


def _message(text: str, status: int) -> HTMLResponse:
    return HTMLResponse(f"<!doctype html><meta charset=utf-8><title>Consent file</title>"
                        f"<p style='font:16px system-ui;margin:3rem auto;max-width:32rem'>{text}</p>", status_code=status)


@router.get("/consent-files/{ticket}", response_class=RedirectResponse)
def open_consent_file(ticket: str, request: Request):
    """Where the link goes: checks it, records who opened the file, and forwards to it."""
    limit(request, "consent-file", attempts=60)
    data = tickets.read(get_settings().supabase_secret_key, ticket)
    if not data:
        return _message("This link has expired. Open the consent file again from Pramaan.", 410)
    db = get_db()
    member = db.table("profiles").select("role, deactivated_at").eq("id", data["u"]).eq("org_id", data["o"]).execute().data
    if not member or member[0]["role"] != "head_office" or member[0]["deactivated_at"]:
        return _message("Only head office can open consent files.", 403)
    rows = db.table("toppers").select("full_name, consent_path").eq("id", data["t"]).eq("org_id", data["o"]).execute().data
    if not rows or not rows[0]["consent_path"]:
        return _message("There's no consent file for this person any more.", 404)
    signed = db.storage.from_("consent").create_signed_url(rows[0]["consent_path"], 60)
    audit(data["o"], data["u"], "consent_viewed", "topper", data["t"], {"name": rows[0]["full_name"]})
    return RedirectResponse(signed.get("signedURL") or signed.get("signedUrl"), status_code=303)

