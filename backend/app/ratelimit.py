"""A small in-memory rate limit for the public join endpoints, so nobody can guess join codes by
trying thousands. One server process, so memory is enough; it resets when the server restarts."""

from collections import deque
from time import monotonic

from fastapi import HTTPException, Request

_hits: dict[str, deque[float]] = {}


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def limit(request: Request, bucket: str, attempts: int = 20, window: float = 600) -> None:
    """Refuse with 429 after `attempts` calls from one address within `window` seconds."""
    key = f"{bucket}:{client_ip(request)}"
    now = monotonic()
    hits = _hits.setdefault(key, deque())
    while hits and now - hits[0] > window:
        hits.popleft()
    if len(hits) >= attempts:
        raise HTTPException(429, "Too many tries from this connection. Wait ten minutes and try again.")
    hits.append(now)
