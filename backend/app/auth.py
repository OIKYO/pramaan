from fastapi import Depends, Header, HTTPException

from app.db import get_db
from app.models import Profile, Role


def current_user(authorization: str | None = Header(default=None)) -> Profile:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "You're not signed in. Sign in and try again.")
    token = authorization.split(" ", 1)[1].strip()
    db = get_db()
    try:
        claims = (db.auth.get_claims(jwt=token) or {})["claims"]
    except Exception:
        raise HTTPException(401, "Your session has expired or isn't valid. Sign in again.") from None
    rows = db.table("profiles").select("*").eq("id", claims["sub"]).limit(1).execute().data
    if not rows:
        raise HTTPException(403, "Your account has no Pramaan profile yet. Ask head office to set one up.")
    profile = Profile(**rows[0])
    if profile.deactivated_at:
        raise HTTPException(403, "Head office has removed your access to Pramaan. Ask them if you need it back.")
    return profile


def require(*roles: Role):
    def dependency(user: Profile = Depends(current_user)) -> Profile:
        if user.role not in roles:
            raise HTTPException(403, "Your role can't do this.")
        return user

    return dependency
