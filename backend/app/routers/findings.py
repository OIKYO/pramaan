"""Reviewers confirm uncertain readings; head office overrides blocking findings."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app import state
from app.auth import current_user
from app.db import audit, get_db
from app.models import NoteRequest, PosterDetail, Profile
from app.routers.posters import build_detail, load_state, refuse
from pipeline.run import IST

router = APIRouter(prefix="/findings", tags=["findings"])


def _load(finding_id: str) -> tuple[dict, state.PosterState, state.FindingState]:
    rows = (get_db().table("findings").select("*, poster_versions(poster_id)").eq("id", finding_id)
            .limit(1).execute().data)
    if not rows:
        raise HTTPException(404, "Finding not found.")
    finding = rows[0]
    poster = load_state(finding["poster_versions"]["poster_id"])
    return finding, poster, state.FindingState(id=finding["id"], severity=finding["severity"], status=finding["status"])


def _close(finding: dict, poster: state.PosterState, user: Profile, new_status: str, text: str, action: str) -> None:
    db = get_db()
    db.table("findings").update({
        "status": new_status, "override_reason": text.strip(), "resolved_by": user.id,
        "resolved_at": datetime.now(IST).isoformat(),
    }).eq("id", finding["id"]).execute()
    db.table("reviews").insert({"poster_id": poster.id, "version_id": finding["version_id"], "actor_id": user.id,
                                "action": action, "comment": f"{finding['rule_id']}: {text.strip()}"}).execute()
    audit(user.id, action, "finding", finding["id"],
          {"rule_id": finding["rule_id"], "poster_id": poster.id, "note": text.strip()})


@router.post("/{finding_id}/resolve", response_model=PosterDetail)
def resolve(finding_id: str, body: NoteRequest, user: Annotated[Profile, Depends(current_user)]) -> PosterDetail:
    """A reviewer confirms a reading the pipeline wasn't sure about, with a note."""
    finding, poster, fs = _load(finding_id)
    try:
        state.resolve(user, poster, fs, body.note)
    except state.Refused as error:
        raise refuse(error) from None
    _close(finding, poster, user, "resolved", body.note, "finding_resolved")
    return build_detail(poster.id, user)


@router.post("/{finding_id}/override", response_model=PosterDetail)
def override(finding_id: str, body: NoteRequest, user: Annotated[Profile, Depends(current_user)]) -> PosterDetail:
    """Head office overrides a blocking finding, with a written reason."""
    finding, poster, fs = _load(finding_id)
    try:
        state.override(user, poster, fs, body.note)
    except state.Refused as error:
        raise refuse(error) from None
    _close(finding, poster, user, "overridden", body.note, "finding_overridden")
    return build_detail(poster.id, user)
