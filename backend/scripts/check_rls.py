"""Check the row-level security policies against the live database, as the real demo users.

    cd backend
    python -m scripts.check_rls

Needs SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_PASSWORD and SUPABASE_PUBLISHABLE_KEY (or the
frontend's VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env). Creates one temporary poster in the
Kolkata branch and deletes it afterwards.
"""

import os
import sys

import httpx

from app.config import REPO_DIR, get_settings, load_env_file
from app.db import get_db

settings = get_settings()
load_env_file(REPO_DIR / "frontend" / ".env")
PUBLISHABLE = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
REST = f"{settings.supabase_url}/rest/v1"
results: list[tuple[bool, str]] = []


def sign_in(email: str) -> dict:
    r = httpx.post(
        f"{settings.supabase_url}/auth/v1/token?grant_type=password",
        headers={"apikey": PUBLISHABLE},
        json={"email": email, "password": settings.demo_password},
    )
    r.raise_for_status()
    return {"apikey": PUBLISHABLE, "Authorization": f"Bearer {r.json()['access_token']}"}


def check(label: str, ok: bool) -> None:
    results.append((ok, label))
    print(("PASS " if ok else "FAIL ") + label)


def rows(headers: dict, path: str) -> list | None:
    r = httpx.get(f"{REST}/{path}", headers=headers)
    return r.json() if r.status_code == 200 else None


def main() -> None:
    if not PUBLISHABLE:
        sys.exit("Set SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env).")
    db = get_db()
    staff = sign_in("staff.siliguri@pramaan.demo")
    other_staff = sign_in("staff.kolkata@pramaan.demo")
    regional = sign_in("regional.east@pramaan.demo")
    hq = sign_in("hq@pramaan.demo")
    anon = {"apikey": PUBLISHABLE}

    kolkata = db.table("branches").select("id").eq("name", "Northfield Kolkata").execute().data[0]["id"]
    creator = db.table("profiles").select("id").eq("full_name", "Rahul Sarkar").execute().data[0]["id"]
    poster = db.table("posters").insert({
        "branch_id": kolkata, "created_by": creator, "title": "RLS check (temporary)", "channel": "print",
    }).execute().data[0]
    try:
        check("signed-out visitors see no posters", rows(anon, "posters?select=id") in ([], None))
        check("Siliguri staff can't see a Kolkata poster", rows(staff, f"posters?id=eq.{poster['id']}") == [])
        check("Kolkata staff see their own branch's poster", len(rows(other_staff, f"posters?id=eq.{poster['id']}") or []) == 1)
        check("regional manager sees posters in the region", len(rows(regional, f"posters?id=eq.{poster['id']}") or []) == 1)
        check("head office sees every poster", len(rows(hq, f"posters?id=eq.{poster['id']}") or []) == 1)

        r = httpx.patch(f"{REST}/posters?id=eq.{poster['id']}", headers=other_staff, json={"status": "approved"})
        check("staff can't change a poster's status directly", r.status_code in (401, 403))
        r = httpx.post(f"{REST}/findings", headers=hq, json={})
        check("even head office can't write findings from the client", r.status_code in (401, 403))

        check("toppers' consent_path is hidden from clients", rows(hq, "toppers?select=consent_path") is None)
        visible = rows(staff, "toppers?select=full_name,has_consent&order=full_name")
        check("everyone can see who has consent", visible is not None and len(visible) == 5)

        r = httpx.patch(f"{REST}/brand_kit?id=eq.1", headers={**staff, "Prefer": "return=representation"},
                        json={"tone_notes": "changed by staff"})
        check("branch staff can't edit the brand kit", r.status_code == 200 and r.json() == [])
        r = httpx.patch(f"{REST}/brand_kit?id=eq.1", headers={**hq, "Prefer": "return=representation"},
                        json={"tone_notes": db.table("brand_kit").select("tone_notes").execute().data[0]["tone_notes"]})
        check("head office can edit the brand kit", r.status_code == 200 and len(r.json()) == 1)

        check("only head office reads the audit log", rows(staff, "audit_log?select=id") == [] and rows(hq, "audit_log?select=id") is not None)

        r = httpx.post(f"{settings.supabase_url}/storage/v1/object/list/consent", headers=hq, json={"prefix": ""})
        check("no client can list consent files", r.status_code != 200 or r.json() == [])
    finally:
        db.table("posters").delete().eq("id", poster["id"]).execute()

    failed = [label for ok, label in results if not ok]
    print(f"\n{len(results) - len(failed)} passed, {len(failed)} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
