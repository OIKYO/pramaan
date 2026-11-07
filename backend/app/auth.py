"""Who is calling: verify the Supabase access token, then load the profile and role.

The frontend sends `Authorization: Bearer <access token>` from supabase-js. The token's signature
is checked against the project's published keys (JWKS), so a forged or expired token is refused.
"""

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
    """Dependency: the signed-in user, who must have one of these roles."""

    def dependency(user: Profile = Depends(current_user)) -> Profile:
        if user.role not in roles:
            raise HTTPException(403, "Your role can't do this.")
        return user

    return dependency
