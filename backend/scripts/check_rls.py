"""Check the row-level security policies against the live database, as the real demo users.

    cd backend
    python -m scripts.check_rls

Needs SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_PASSWORD and SUPABASE_PUBLISHABLE_KEY (or the
frontend's VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env). Creates one temporary poster in the
Kolkata branch and a temporary second organisation (to prove organisations can't see each other),
and deletes both afterwards.
"""

import os
import secrets
import sys

import httpx

from app.config import REPO_DIR, get_settings, load_env_file
from app.db import get_db
from app.models import SignupRequest
from app.routers.organisations import signup
from scripts.seed import ORG_ID

settings = get_settings()
load_env_file(REPO_DIR / "frontend" / ".env")
PUBLISHABLE = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
REST = f"{settings.supabase_url}/rest/v1"
results: list[tuple[bool, str]] = []


def sign_in(email: str, password: str | None = None) -> dict:
    r = httpx.post(
        f"{settings.supabase_url}/auth/v1/token?grant_type=password",
        headers={"apikey": PUBLISHABLE},
        json={"email": email, "password": password or settings.demo_password},
    )
    r.raise_for_status()
    return {"apikey": PUBLISHABLE, "Authorization": f"Bearer {r.json()['access_token']}"}


def check(label: str, ok: bool) -> None:
    results.append((ok, label))
    print(("PASS " if ok else "FAIL ") + label)


def rows(headers: dict, path: str) -> list | None:
    r = httpx.get(f"{REST}/{path}", headers=headers)
    return r.json() if r.status_code == 200 else None


def other_organisation(db, northfield_hq: dict) -> None:
    password = secrets.token_urlsafe(16)
    email = f"rls-check-{secrets.token_hex(4)}@example.org"
    created = signup(SignupRequest(organisation_name="RLS check (temporary)", full_name="Check Person",
                                   email=email, password=password))
    try:
        other = sign_in(email, password)
        check("a new organisation sees none of Northfield's posters", rows(other, "posters?select=id") == [])
        check("...none of its toppers", rows(other, "toppers?select=full_name") == [])
        check("...none of its people", [p["email"] for p in rows(other, "profiles?select=email") or []] == [email])
        kits = rows(other, "brand_kit?select=registered_name") or []
        check("...only its own brand kit", [k["registered_name"] for k in kits] == ["RLS check (temporary)"])
        r = httpx.patch(f"{REST}/brand_kit?org_id=eq.{ORG_ID}", headers={**other, "Prefer": "return=representation"},
                        json={"tone_notes": "changed by another organisation"})
        check("...and can't edit Northfield's brand kit", r.status_code == 200 and r.json() == [])
        r = httpx.post(f"{REST}/courses", headers={**other, "Prefer": "return=representation"},
                       json={"name": "Check course", "course_type": "online", "duration_label": "1 month",
                             "duration_months": 1, "is_paid": False})
        check("its head office adds a course into its own organisation",
              r.status_code == 201 and r.json()[0]["org_id"] == created.org_id)
        check("Northfield can't see that course", rows(northfield_hq, "courses?name=eq.Check%20course") == [])
        r = httpx.post(f"{REST}/courses", headers=other, json={"org_id": ORG_ID, "name": "Sneaky", "course_type": "online",
                                                              "duration_label": "1", "duration_months": 1, "is_paid": False})
        check("it can't add a course into Northfield", r.status_code in (401, 403))
    finally:
        db.table("organisations").delete().eq("id", created.org_id).execute()
        db.auth.admin.delete_user(created.user_id)


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
    creator = db.table("profiles").select("id").eq("email", "staff.kolkata@pramaan.demo").execute().data[0]["id"]
    poster = db.table("posters").insert({
        "org_id": ORG_ID, "branch_id": kolkata, "created_by": creator, "title": "RLS check (temporary)", "channel": "print",
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

        kit = f"{REST}/brand_kit?org_id=eq.{ORG_ID}"
        r = httpx.patch(kit, headers={**staff, "Prefer": "return=representation"}, json={"tone_notes": "changed by staff"})
        check("branch staff can't edit the brand kit", r.status_code == 200 and r.json() == [])
        tone = db.table("brand_kit").select("tone_notes").eq("org_id", ORG_ID).execute().data[0]["tone_notes"]
        r = httpx.patch(kit, headers={**hq, "Prefer": "return=representation"}, json={"tone_notes": tone})
        check("head office can edit the brand kit", r.status_code == 200 and len(r.json()) == 1)

        check("only head office reads the audit log", rows(staff, "audit_log?select=id") == [] and rows(hq, "audit_log?select=id") is not None)

        r = httpx.post(f"{settings.supabase_url}/storage/v1/object/list/consent", headers=hq, json={"prefix": ""})
        check("no client can list consent files", r.status_code != 200 or r.json() == [])
    finally:
        db.table("posters").delete().eq("id", poster["id"]).execute()
    other_organisation(db, hq)

    failed = [label for ok, label in results if not ok]
    print(f"\n{len(results) - len(failed)} passed, {len(failed)} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
