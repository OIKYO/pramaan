"""Creating sign-ins for an organisation's people. Used by signup, the Team page and CSV imports.

New members get a temporary password that head office passes on (shown once, never stored by us).
They must choose their own the first time they sign in, so the temporary one stops working quickly.
Pramaan doesn't send email: free email sending is rate-limited, and head office already knows how
to reach its staff.
"""

import secrets

from fastapi import HTTPException

ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"  # no 0/o, 1/l/i: easy to read out or type from a message


def temporary_password() -> str:
    """Like 'k7mq-x3vp-9tah': 12 random characters, about 59 bits."""
    return "-".join("".join(secrets.choice(ALPHABET) for _ in range(4)) for _ in range(3))


def create_login(db, email: str, password: str, full_name: str) -> str:
    """A confirmed Supabase sign-in. Returns the user id; refuses an email that's already taken."""
    try:
        created = db.auth.admin.create_user({
            "email": email, "password": password, "email_confirm": True, "user_metadata": {"full_name": full_name},
        })
    except Exception as exc:
        text = str(exc).lower()
        if "already" in text or "exists" in text or "registered" in text:
            raise HTTPException(409, f"{email} already has a Pramaan account. Use a different email.") from None
        if "password" in text:
            raise HTTPException(422, "That password is too weak. Use at least 8 characters.") from None
        raise HTTPException(502, "The sign-in service didn't answer. Try again in a minute.") from None
    return created.user.id


def add_profile(db, user_id: str, org_id: str, full_name: str, email: str, role: str,
                branch_id: str | None, region_id: str | None, needs_password_change: bool) -> dict:
    """The member's profile; if it can't be saved, the sign-in is removed so nothing is left half-made."""
    try:
        return db.table("profiles").insert({
            "id": user_id, "org_id": org_id, "full_name": full_name, "email": email, "role": role,
            "branch_id": branch_id if role == "branch_staff" else None,
            "region_id": region_id if role == "regional_manager" else None,
            "needs_password_change": needs_password_change,
        }).execute().data[0]
    except Exception:
        db.auth.admin.delete_user(user_id)
        raise


def placement(db, org_id: str, role: str, branch_id: str | None, region_id: str | None) -> tuple[str | None, str | None]:
    """Check that branch staff have a branch and regional managers a region, in this organisation."""
    if role == "branch_staff":
        if not branch_id or not db.table("branches").select("id").eq("id", branch_id).eq("org_id", org_id).execute().data:
            raise HTTPException(422, "Branch staff need a branch. Choose one of your branches.")
        return branch_id, None
    if role == "regional_manager":
        if not region_id or not db.table("regions").select("id").eq("id", region_id).eq("org_id", org_id).execute().data:
            raise HTTPException(422, "Regional managers need a region. Choose one of your regions.")
        return None, region_id
    return None, None
