"""The signed-in person's own account: their name, and choosing a password (required after a
temporary one). Role and branch are head office's to change, on the Team page."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.auth import current_user
from app.db import audit, get_db
from app.models import MeUpdate, PasswordChange, Profile

router = APIRouter(prefix="/me", tags=["account"])


@router.post("/password", status_code=204)
def change_password(body: PasswordChange, user: Annotated[Profile, Depends(current_user)]) -> Response:
    db = get_db()
    db.auth.admin.update_user_by_id(user.id, {"password": body.password})
    db.table("profiles").update({"needs_password_change": False}).eq("id", user.id).execute()
    audit(user.org_id, user.id, "password_changed", "profile", user.id)
    return Response(status_code=204)


@router.patch("", status_code=204)
def update_me(body: MeUpdate, user: Annotated[Profile, Depends(current_user)]) -> Response:
    """Change your own name. Only the name: anything else would let people promote themselves."""
    name = " ".join(body.full_name.split())
    db = get_db()
    db.table("profiles").update({"full_name": name}).eq("id", user.id).execute()
    db.auth.admin.update_user_by_id(user.id, {"user_metadata": {"full_name": name}})
    audit(user.org_id, user.id, "name_changed", "profile", user.id, {"before": user.full_name, "after": name})
    return Response(status_code=204)
