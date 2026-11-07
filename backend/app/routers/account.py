"""The signed-in person's own account: choosing a password (required after a temporary one)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.auth import current_user
from app.db import audit, get_db
from app.models import PasswordChange, Profile

router = APIRouter(prefix="/me", tags=["account"])


@router.post("/password", status_code=204)
def change_password(body: PasswordChange, user: Annotated[Profile, Depends(current_user)]) -> Response:
    db = get_db()
    db.auth.admin.update_user_by_id(user.id, {"password": body.password})
    db.table("profiles").update({"needs_password_change": False}).eq("id", user.id).execute()
    audit(user.org_id, user.id, "password_changed", "profile", user.id)
    return Response(status_code=204)
