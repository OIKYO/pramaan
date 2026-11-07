"""Consent files: head office uploads them to the private bucket and opens them through
short-lived signed URLs. They never go to the AI and no client can read the bucket directly."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth import require
from app.db import audit, get_db
from app.models import ConsentUploaded, ConsentUrl, Profile
from pipeline.run import IST

router = APIRouter(prefix="/toppers", tags=["toppers"])
MAX_PDF_BYTES = 10 * 1024 * 1024
URL_SECONDS = 120
HeadOffice = Annotated[Profile, Depends(require("head_office"))]


def _topper(topper_id: str) -> dict:
    rows = get_db().table("toppers").select("id, full_name, consent_path").eq("id", topper_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "That student isn't in the toppers register.")
    return rows[0]


@router.post("/{topper_id}/consent", response_model=ConsentUploaded)
def upload_consent(topper_id: str, user: HeadOffice, file: Annotated[UploadFile, File()]) -> ConsentUploaded:
    topper = _topper(topper_id)
    data = file.file.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(413, "The consent file is larger than 10 MB. Scan it at a lower resolution.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(415, "Consent must be a PDF. Scan or export the signed form as PDF.")
    path = f"{topper_id}/consent-{datetime.now(IST):%Y%m%d-%H%M%S}.pdf"
    db = get_db()
    db.storage.from_("consent").upload(path, data, {"content-type": "application/pdf", "upsert": "true"})
    db.table("toppers").update({"consent_path": path, "verified_by": user.id,
                                "verified_at": datetime.now(IST).isoformat()}).eq("id", topper_id).execute()
    audit(user.id, "consent_uploaded", "topper", topper_id, {"name": topper["full_name"], "path": path})
    return ConsentUploaded(topper_id=topper_id, has_consent=True)


@router.get("/{topper_id}/consent-url", response_model=ConsentUrl)
def consent_url(topper_id: str, user: HeadOffice) -> ConsentUrl:
    topper = _topper(topper_id)
    if not topper["consent_path"]:
        raise HTTPException(404, f"There's no consent on file for {topper['full_name']}.")
    signed = get_db().storage.from_("consent").create_signed_url(topper["consent_path"], URL_SECONDS)
    audit(user.id, "consent_viewed", "topper", topper_id, {"name": topper["full_name"]})
    return ConsentUrl(url=signed.get("signedURL") or signed.get("signedUrl"), expires_in=URL_SECONDS)
