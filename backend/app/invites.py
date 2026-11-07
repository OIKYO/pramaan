"""Invites and join codes: how people get into an organisation without head office typing them in.

Two ways in:
  * An invite link, made by head office (for anyone) or a regional manager (for branch staff in
    their region). It names the role and branch or region, works once, and expires after 7 days.
    Only a hash of its token is stored, so the link is shown once, when it's made.
  * The organisation's join code, which members pass on in person. Someone signing up with it joins
    as branch staff of the branch they choose. Head office can replace the code if it leaks.

No database here, so the rules are unit-tested; routers/invites.py does the reading and writing.
"""

import hashlib
import re
import secrets
from datetime import datetime, timedelta

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I/L: easy to read out
INVITE_DAYS = 7


def new_code() -> str:
    """Like 'K7MQ-X3VP': 8 random characters, about 40 bits."""
    raw = "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))
    return f"{raw[:4]}-{raw[4:]}"


def normalise_code(raw: str) -> str:
    """What people type ('k7mq x3vp', 'K7MQX3VP') in the stored form ('K7MQ-X3VP')."""
    text = re.sub(r"[^A-Za-z0-9]", "", raw or "").upper()
    return f"{text[:4]}-{text[4:]}" if len(text) == 8 else text


def new_token() -> str:
    return secrets.token_urlsafe(24)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def expiry(now: datetime) -> datetime:
    return now + timedelta(days=INVITE_DAYS)


def invite_problem(inviter_role: str, inviter_region: str | None, role: str, branch_region: str | None) -> str | None:
    """Why this person can't send this invite, or None if they can. Head office invites anyone;
    regional managers invite branch staff for branches in their own region."""
    if inviter_role == "head_office":
        return None
    if inviter_role == "regional_manager":
        if role != "branch_staff":
            return "Regional managers can invite branch staff only. Ask head office to invite managers."
        if branch_region != inviter_region:
            return "You can invite people only to branches in your region."
        return None
    return "Your role can't invite people. Ask your regional manager or head office."


def invite_status(row: dict, now: datetime) -> str:
    """pending, used, revoked or expired."""
    if row.get("used_at"):
        return "used"
    if row.get("revoked_at"):
        return "revoked"
    expires = row["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    return "expired" if expires <= now else "pending"
