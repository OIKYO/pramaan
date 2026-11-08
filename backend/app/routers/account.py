from typing import Annotated

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response

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


@router.post("/delete", status_code=204)
def delete_me(user: Annotated[Profile, Depends(current_user)]) -> Response:
    """Delete your account. Your name and email are removed and you can't sign in again. Posters and
    reviews you made stay in your organisation's history, shown as made by a former member."""
    db = get_db()
    if user.role == "head_office":
        others = (db.table("profiles").select("id").eq("org_id", user.org_id).eq("role", "head_office")
                  .is_("deactivated_at", "null").neq("id", user.id).execute().data)
        if not others:
            raise HTTPException(409, "You're the only head office. Make someone else head office first, "
                                     "or delete the whole organisation from Organisation > Profile.")
    audit(user.org_id, user.id, "account_deleted", "profile", user.id)
    db.table("profiles").update({"full_name": "Former member", "email": None,
                                 "deactivated_at": datetime.now(timezone.utc).isoformat()}).eq("id", user.id).execute()
    db.auth.admin.update_user_by_id(user.id, {
        "email": f"deleted-{user.id}@deleted.invalid", "email_confirm": True, "user_metadata": {}, "ban_duration": "876000h",
    })
    return Response(status_code=204)
