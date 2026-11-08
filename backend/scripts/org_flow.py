"""A new company's first hour, over HTTP: sign up as a coaching institute, choose rulebooks, add a
branch, import data, add the team, and check a first poster, while staying invisible to every other
organisation. Deletes everything it made.

    cd backend
    python -m scripts.org_flow                          # against http://localhost:8000
    python -m scripts.org_flow https://<render-url>     # against the deployed API
"""

import os
import secrets
import sys

import httpx

from app.config import REPO_DIR, get_settings, load_env_file
from app.db import get_db

settings = get_settings()
load_env_file(REPO_DIR / "frontend" / ".env")
PUBLISHABLE = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
REST = f"{settings.supabase_url}/rest/v1"
results: list[tuple[bool, str]] = []

COURSES = "name,course_type,duration_label,duration_months,is_paid,fee_inr\n2-Year Classroom Programme,classroom,2 years,24,yes,48000\n"
TOPPERS_BAD = "full_name,exam,exam_year,rank,result_date,course\nRiya Sen,JEE Main,2026,seventy,2026-04-19,Missing course\n"
TOPPERS = ("full_name,exam,exam_year,rank,result_date,course,consent_date,consent_channels\n"
           "Riya Sen,JEE Main,2026,73,2026-04-19,2-Year Classroom Programme,2026-05-02,print; instagram\n")


def strong_password() -> str:
    return secrets.token_urlsafe(12) + "-7"


def check(label: str, ok: bool, extra: str = "") -> None:
    results.append((ok, label))
    print(("PASS " if ok else "FAIL ") + label + (f"  ({extra})" if extra and not ok else ""))


def token(email: str, password: str) -> str | None:
    r = httpx.post(f"{settings.supabase_url}/auth/v1/token?grant_type=password",
                   headers={"apikey": PUBLISHABLE}, json={"email": email, "password": password})
    return r.json().get("access_token") if r.status_code == 200 else None


def client(api: str, access: str) -> httpx.Client:
    return httpx.Client(base_url=api, headers={"Authorization": f"Bearer {access}"}, timeout=180)


def rest(access: str) -> dict:
    return {"apikey": PUBLISHABLE, "Authorization": f"Bearer {access}", "Prefer": "return=representation"}


def upload(c: httpx.Client, dataset: str, text: str, commit: bool) -> httpx.Response:
    return c.post(f"/imports/{dataset}", files={"file": (f"{dataset}.csv", text.encode(), "text/csv")},
                  data={"commit": str(commit).lower()})


def main() -> None:
    api = next((a for a in sys.argv[1:] if not a.startswith("--")), "http://localhost:8000").rstrip("/")
    db = get_db()
    email, password = f"founder-{secrets.token_hex(4)}@example.org", strong_password()
    r = httpx.get(f"{api}/catalog", timeout=60)
    check("the industry catalog is open before sign-up", r.status_code == 200 and len(r.json()["industries"]) == 30)
    r = httpx.post(f"{api}/signup", json={"organisation_name": "Brightpath Tutorials (test)", "full_name": "Asha Rao",
                                          "email": email, "password": password, "industry_group": "education",
                                          "industry": "coaching institutes", "org_type": "coaching"}, timeout=60)
    check("a new company signs up as a coaching institute", r.status_code == 201, r.text[:200])
    org_id = r.json()["org_id"]
    users = [r.json()["user_id"]]
    try:
        r = httpx.post(f"{api}/signup", json={"organisation_name": "Again", "full_name": "Asha Rao", "email": email,
                                              "password": password}, timeout=60)
        check("the same email can't sign up twice", r.status_code == 409)
        hq_token = token(email, password)
        hq = client(api, hq_token)
        kept = {b["id"] for b in hq.get("/rules").json()["rulebooks"] if b["enabled"]}
        check("it starts with the rulebooks a coaching institute needs",
              kept == {"brand", "contacts", "claims", "people", "rights", "offerings", "figures", "dates", "offers",
                       "legal", "rankings"}, str(kept))
        r = hq.patch("/organisation", json={"rulebooks": ["claims", "offerings", "people", "rankings"]})
        check("head office removes a rulebook", r.status_code == 200 and "figures" not in r.json()["rulebooks"], r.text[:200])
        check("...and its data can't be imported any more", "results" not in [d["dataset"] for d in hq.get("/imports").json()])
        check("an unknown rulebook is refused", hq.patch("/organisation", json={"rulebooks": ["astrology"]}).status_code == 400)
        hq.patch("/organisation", json={"rulebooks": ["offerings", "figures", "dates", "offers", "legal", "rankings"]})
        check("head office renames themself", hq.patch("/me", json={"full_name": "Asha R. Rao"}).status_code == 204)

        region = httpx.post(f"{REST}/regions", headers=rest(hq_token), json={"name": "North"}).json()[0]
        branch = httpx.post(f"{REST}/branches", headers=rest(hq_token), json={
            "name": "Brightpath Dehradun", "city": "Dehradun", "region_id": region["id"],
            "phone": "+91 10000 33001", "address": "1 Rajpur Road, Dehradun"}).json()[0]
        check("head office adds a region and a branch", branch["org_id"] == org_id)

        r = hq.get("/imports")
        check("five kinds of data can be imported", [d["dataset"] for d in r.json()] ==
              ["branches", "courses", "results", "toppers", "members"])
        r = upload(hq, "courses", COURSES, commit=True)
        check("courses import from CSV", r.status_code == 200 and r.json()["created"] == 1, r.text[:200])
        r = upload(hq, "toppers", TOPPERS_BAD, commit=False)
        issues = {(i["row"], i["column"]) for i in r.json()["issues"]}
        check("a bad toppers file is explained row by row", issues == {(2, "rank")}, str(issues))
        check("...and refused when confirmed", upload(hq, "toppers", TOPPERS_BAD, commit=True).status_code == 422)
        r = upload(hq, "toppers", TOPPERS, commit=True)
        check("the fixed file imports", r.status_code == 200 and r.json()["created"] == 1, r.text[:200])

        staff_email = f"staff-{secrets.token_hex(4)}@example.org"
        members = f"full_name,email,role,branch,region\nRavi Negi,{staff_email},branch staff,Brightpath Dehradun,\n"
        r = upload(hq, "members", members, commit=True)
        creds = r.json().get("credentials", [])
        check("the team imports with temporary passwords", r.status_code == 200 and len(creds) == 1, r.text[:200])
        staff_id = db.table("profiles").select("id, needs_password_change").eq("email", staff_email).execute().data[0]
        users.append(staff_id["id"])
        check("new members must choose a password", staff_id["needs_password_change"] is True)

        staff_token = token(staff_email, creds[0]["temporary_password"])
        staff = client(api, staff_token)
        new_password = strong_password()
        check("they choose their own password", staff.post("/me/password", json={"password": new_password}).status_code == 204)
        check("branch staff can't change the rulebooks", staff.patch("/organisation", json={"rulebooks": []}).status_code == 403)
        check("...and the temporary one stops working", token(staff_email, creds[0]["temporary_password"]) is None)
        staff = client(api, token(staff_email, new_password))

        # Invites and the join code
        check("branch staff can't invite people", staff.post("/invites", json={"role": "branch_staff", "branch_id": branch["id"]}).status_code == 403)
        r = hq.post("/invites", json={"role": "branch_staff", "branch_id": branch["id"]})
        check("head office makes an invite link", r.status_code == 201, r.text[:200])
        invite_token = r.json()["token"]
        r = httpx.get(f"{api}/join/invite/{invite_token}", timeout=60)
        check("anyone with the link sees what it's for", r.status_code == 200 and r.json()["branch"] == "Brightpath Dehradun", r.text[:200])
        joiner_email = f"invited-{secrets.token_hex(4)}@example.org"
        joiner = {"full_name": "Neha Bisht", "email": joiner_email, "password": strong_password()}
        r = httpx.post(f"{api}/join/invite/{invite_token}", json=joiner, timeout=60)
        check("they join the organisation with it", r.status_code == 201, r.text[:200])
        joined = db.table("profiles").select("id, org_id, role, branch_id").eq("email", joiner_email).execute().data
        users += [j["id"] for j in joined]
        check("...as branch staff of that branch", bool(joined) and joined[0]["org_id"] == org_id and joined[0]["branch_id"] == branch["id"])
        r = httpx.post(f"{api}/join/invite/{invite_token}", json={**joiner, "email": "again-" + joiner_email}, timeout=60)
        check("an invite works only once", r.status_code == 410, r.text[:200])
        code = hq.get("/organisation/join-code").json()["code"]
        check("branch staff can't see the join code", staff.get("/organisation/join-code").status_code == 403)
        r = httpx.get(f"{api}/join/code/{code.lower().replace('-', ' ')}", timeout=60)
        check("the join code finds the organisation and its branches", r.status_code == 200 and r.json()["branches"][0]["id"] == branch["id"])
        coder_email = f"coded-{secrets.token_hex(4)}@example.org"
        coder_password = strong_password()
        r = httpx.post(f"{api}/join/code", json={"code": code, "branch_id": branch["id"], "full_name": "Kiran Rawat",
                                                  "email": coder_email, "password": coder_password}, timeout=60)
        check("someone joins with the code", r.status_code == 201, r.text[:200])
        users += [p["id"] for p in db.table("profiles").select("id").eq("email", coder_email).execute().data]
        new_code = hq.post("/organisation/join-code").json()["code"]
        check("head office replaces the code and the old one stops working",
              new_code != code and httpx.get(f"{api}/join/code/{code}", timeout=60).status_code == 404)

        image = (REPO_DIR / "test-posters" / "01-clean.png").read_bytes()
        r = staff.post("/posters", data={"title": "First poster", "channel": "print"},
                       files={"image": ("01-clean.png", image, "image/png")})
        check("their first poster is checked against their own rulebook", r.status_code == 201, r.text[:200])
        poster_id = r.json()["id"]

        northfield = client(api, token("hq@pramaan.demo", settings.demo_password))
        check("Northfield's head office can't open it", northfield.get(f"/posters/{poster_id}").status_code == 404)
        check("...or see the new company's insights", northfield.get("/insights").json()["total_posters"] >= 0 and
              hq.get("/insights").json()["total_posters"] == 1)

        r = hq.post(f"/members/{staff_id['id']}/deactivate")
        check("head office removes someone's access", r.status_code == 200 and r.json()["deactivated_at"])
        check("...and their next request is refused", staff.get("/rules").status_code in (401, 403))
        check("head office can't remove itself", hq.post(f"/members/{users[0]}/deactivate").status_code == 409)

        # Deleting an account, then the whole organisation
        coder = client(api, token(coder_email, coder_password))
        check("someone deletes their own account", coder.post("/me/delete").status_code == 204)
        check("...and can't sign in again", token(coder_email, coder_password) is None)
        check("the only head office can't delete their account", hq.post("/me/delete").status_code == 409)
        check("deleting the organisation needs its exact name",
              hq.post("/organisation/delete", json={"confirm_name": "Brightpath"}).status_code == 400)
        r = hq.post("/organisation/delete", json={"confirm_name": "Brightpath Tutorials (test)"})
        check("head office deletes the organisation", r.status_code == 204, r.text[:200])
        check("...and nothing of it is left", not db.table("organisations").select("id").eq("id", org_id).execute().data
              and not db.table("profiles").select("id").eq("org_id", org_id).execute().data)
    finally:
        for poster in db.table("posters").select("id").eq("org_id", org_id).execute().data:
            for v in db.table("poster_versions").select("image_path").eq("poster_id", poster["id"]).execute().data:
                db.storage.from_("posters").remove([v["image_path"]])
        db.table("posters").delete().eq("org_id", org_id).execute()
        db.table("audit_log").delete().eq("org_id", org_id).execute()
        db.table("organisations").delete().eq("id", org_id).execute()
        for user_id in users:
            try:
                db.auth.admin.delete_user(user_id)
            except Exception:
                pass  # already gone with the organisation

    failed = [label for ok, label in results if not ok]
    print(f"\n{len(results) - len(failed)} passed, {len(failed)} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
