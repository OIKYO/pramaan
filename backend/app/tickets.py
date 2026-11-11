import base64
import hashlib
import hmac
import json
import time


def _key(secret: str) -> bytes:
    return hashlib.sha256(b"pramaan file ticket " + secret.encode()).digest()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def make(secret: str, payload: dict, seconds: int, now: float | None = None) -> str:
    """A link-safe ticket that carries `payload` until it expires, signed so it can't be altered."""
    body = _b64(json.dumps({**payload, "exp": int((now or time.time()) + seconds)}, separators=(",", ":")).encode())
    return f"{body}.{_b64(hmac.new(_key(secret), body.encode(), hashlib.sha256).digest())}"


def read(secret: str, ticket: str, now: float | None = None) -> dict | None:
    """The payload, or None if the ticket was altered or has expired."""
    body, _, signature = ticket.partition(".")
    expected = _b64(hmac.new(_key(secret), body.encode(), hashlib.sha256).digest())
    if not body or not hmac.compare_digest(signature, expected):
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    except ValueError:
        return None
    return payload if payload.get("exp", 0) > (now or time.time()) else None
