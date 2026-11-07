"""The Supabase client the backend uses. It holds the secret (service role) key, which bypasses
row-level security, so it must never leave the server."""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_db() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env")
    return create_client(settings.supabase_url, settings.supabase_secret_key)


def audit(actor_id: str | None, action: str, target_type: str, target_id: str | None, details: dict | None = None) -> None:
    """Every status change and every AI call goes in the audit log."""
    get_db().table("audit_log").insert({
        "actor_id": actor_id, "action": action, "target_type": target_type,
        "target_id": target_id, "details": details or {},
    }).execute()
