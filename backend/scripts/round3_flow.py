"""Round 3 over HTTP: a consent link from a poster's finding (approve, then withdraw), and posts with
several pages (a carousel and a PDF). Uses a throwaway organisation.

    cd backend
    python -m scripts.round3_flow https://<render-url> --keep   # leave it for a look in the browser
    python -m scripts.round3_flow --cleanup                     # then delete what --keep left
"""

import io
import json
import secrets
import sys
from datetime import date, timedelta

import httpx
from PIL import Image

from app.config import BACKEND_DIR, REPO_DIR
from app.db import get_db
from pipeline.pages import unstack_box
from scripts.org_flow import COURSES, REST, check, client, rest, results, strong_password, token, upload

KEPT = BACKEND_DIR / ".cache" / "round3-flow.json"
TOPPERS = "full_name,exam,exam_year,rank,result_date,course\nRiya Sen,JEE Main,2026,73,2026-04-19,2-Year Classroom Programme\n"
POSTERS = REPO_DIR / "test-posters"


def cleanup(org_id: str, users: list[str]) -> None:
    db = get_db()
    for poster in db.table("posters").select("id").eq("org_id", org_id).execute().data:
        paths = [p["image_path"] for v in db.table("poster_versions").select("image_path, pages").eq("poster_id", poster["id"]).execute().data
                 for p in (v.get("pages") or [{"image_path": v["image_path"]}])]
        if paths:
            db.storage.from_("posters").remove(paths)
    db.table("posters").delete().eq("org_id", org_id).execute()
    db.table("audit_log").delete().eq("org_id", org_id).execute()
    db.table("organisations").delete().eq("id", org_id).execute()
    for user_id in users:
        try:
            db.auth.admin.delete_user(user_id)
        except Exception:
            pass


def open_findings(detail: dict, rule_id: str) -> list[dict]:
    current = next(v for v in detail["versions"] if v["version"] == detail["current_version"])
    return [f for f in current["findings"] if f["rule_id"] == rule_id and f["status"] == "open" and f["severity"] != "pass"]


def main() -> None:
    if "--cleanup" in sys.argv:
        kept = json.loads(KEPT.read_text(encoding="utf-8"))
        cleanup(kept["org_id"], kept["users"])
        KEPT.unlink()
        print("deleted", kept["org"])
        return
    api = next((a for a in sys.argv[1:] if not a.startswith("--")), "http://localhost:8000").rstrip("/")
    db = get_db()
    org = f"Brightpath Tutorials (round 3 {secrets.token_hex(2)})"
    email, password = f"founder-{secrets.token_hex(4)}@example.org", strong_password()
    r = httpx.post(f"{api}/signup", json={"organisation_name": org, "full_name": "Asha Rao", "email": email, "password": password,
                                          "industry_group": "education", "industry": "coaching institutes", "org_type": "coaching"}, timeout=90)
    check("a coaching institute signs up", r.status_code == 201, r.text[:200])
    org_id, users = r.json()["org_id"], [r.json()["user_id"]]
    keep = "--keep" in sys.argv
    try:
        hq_token = token(email, password)
        hq = client(api, hq_token)
        region = httpx.post(f"{REST}/regions", headers=rest(hq_token), json={"name": "North Bengal"}).json()[0]
        branch = httpx.post(f"{REST}/branches", headers=rest(hq_token), json={
            "name": "Brightpath Siliguri", "city": "Siliguri", "region_id": region["id"],
            "phone": "+91 10000 22102", "address": "12 Sevoke Road, Siliguri"}).json()[0]
        upload(hq, "courses", COURSES, commit=True)
        upload(hq, "toppers", TOPPERS, commit=True)
        riya = db.table("toppers").select("id, has_consent").eq("org_id", org_id).execute().data[0]
        check("Riya Sen is in the register without consent", riya["has_consent"] is False)
        staff_email = f"staff-{secrets.token_hex(4)}@example.org"
        creds = upload(hq, "members", f"full_name,email,role,branch,region\nNeha Bisht,{staff_email},branch staff,Brightpath Siliguri,\n",
                       commit=True).json()["credentials"]
        users += [p["id"] for p in db.table("profiles").select("id").eq("email", staff_email).execute().data]
        staff_password = strong_password()
        client(api, token(staff_email, creds[0]["temporary_password"])).post("/me/password", json={"password": staff_password})
        staff = client(api, token(staff_email, staff_password))

        # ---- consent by link
        image = (POSTERS / "01-clean.png").read_bytes()
        r = staff.post("/posters", data={"title": "Riya's result", "channel": "instagram", "alt_text": "Riya Sen, AIR 73, JEE Main 2026",
                                         "tagged_topper_ids": [riya["id"]]}, files={"image": ("01-clean.png", image, "image/png")})
        check("branch staff upload a poster showing Riya", r.status_code == 201, r.text[:200])
        poster = r.json()
        version_id = poster["versions"][-1]["id"]
        missing = [f for f in open_findings(poster, "CCPA-02") if f["evidence"].get("topper_id") == riya["id"]]
        check("it's blocked: no consent from Riya", len(missing) == 1, str([f["message"] for f in open_findings(poster, "CCPA-02")]))
        until = (date.today() + timedelta(days=365)).isoformat()
        check("branch staff can't make consent links",
              staff.post("/consent-requests", json={"topper_id": riya["id"], "channels": ["instagram"], "valid_until": until}).status_code == 403)
        r = hq.post("/consent-requests", json={"topper_id": riya["id"], "version_id": version_id, "channels": ["instagram", "print"],
                                               "valid_until": until})
        check("head office makes a consent link from the poster", r.status_code == 201, r.text[:200])
        link = r.json()["token"]
        page = httpx.get(f"{api}/consent/{link}", timeout=60).json()
        check("the link shows the exact poster with Riya marked", page["status"] == "pending" and page["image_url"] and page["box_2d"]
              and page["person_name"] == "Riya Sen", json.dumps(page)[:300])
        check("...and what it says about her", any("73" in line for line in page["shown"]), str(page["shown"]))
        check("a wrong link finds nothing", httpx.get(f"{api}/consent/not-a-real-link", timeout=60).status_code == 404)
        check("approving needs agreement",
              httpx.post(f"{api}/consent/{link}/approve", json={"signer_name": "Riya Sen", "relation": "self", "agree": False}, timeout=60).status_code == 422)
        r = httpx.post(f"{api}/consent/{link}/approve", json={"signer_name": "Riya Sen", "relation": "self", "agree": True}, timeout=60)
        check("Riya approves", r.status_code == 200 and r.json()["status"] == "approved", r.text[:200])
        check("a link can't be answered twice",
              httpx.post(f"{api}/consent/{link}/decline", json={"reason": None}, timeout=60).status_code == 409)
        topper = db.table("toppers").select("has_consent, consent_source, consent_channels").eq("id", riya["id"]).execute().data[0]
        check("the register now has her consent, from the link", topper["has_consent"] and topper["consent_source"] == "link"
              and set(topper["consent_channels"]) == {"instagram", "print"}, str(topper))
        poster = staff.get(f"/posters/{poster['id']}").json()
        check("her consent finding cleared by itself",
              not [f for f in open_findings(poster, "CCPA-02") if f["evidence"].get("topper_id") == riya["id"]])
        check("...and the history says the consent link did it",
              any(rv["action"] == "finding_resolved" and rv["actor_id"] is None and rv["actor_name"] == "Consent link" for rv in poster["reviews"]))
        r = staff.post(f"/posters/{poster['id']}/submit")
        check("branch staff submit it", r.status_code == 200 and r.json()["status"] == "in_review", r.text[:200])
        r = httpx.post(f"{api}/consent/{link}/withdraw", json={"signer_name": "Riya Sen"}, timeout=60)
        check("Riya withdraws through the same link", r.status_code == 200 and r.json()["status"] == "withdrawn", r.text[:200])
        poster = staff.get(f"/posters/{poster['id']}").json()
        check("the poster went back to the branch", poster["status"] == "changes_requested", poster["status"])
        blocked = [f for f in open_findings(poster, "CCPA-02") if f["severity"] == "block" and "withdrew consent" in f["message"]]
        check("...with a blocking finding that says why", len(blocked) == 1, str([f["message"] for f in open_findings(poster, "CCPA-02")]))
        check("...and a history entry from the consent link",
              any(rv["action"] == "consent_withdrawn" and rv["actor_id"] is None for rv in poster["reviews"]))
        topper = db.table("toppers").select("has_consent, consent_withdrawn_at").eq("id", riya["id"]).execute().data[0]
        check("the register shows the withdrawal", not topper["has_consent"] and topper["consent_withdrawn_at"])
        r = hq.post("/consent-requests", json={"topper_id": riya["id"], "channels": ["print"], "valid_until": until})
        spare = r.json()
        check("head office makes a second link from the register", r.status_code == 201 and spare["request"]["poster_id"] is None)
        r = hq.post(f"/consent-requests/{spare['request']['id']}/revoke")
        check("...and cancels it", r.status_code == 200 and r.json()["status"] == "revoked")
        check("a cancelled link can't be approved",
              httpx.post(f"{api}/consent/{spare['token']}/approve", json={"signer_name": "Riya Sen", "relation": "self", "agree": True},
                         timeout=60).status_code == 409)
        listed = hq.get("/consent-requests", params={"topper_id": riya["id"]}).json()
        check("head office sees every link and its answer", sorted(x["status"] for x in listed) == ["revoked", "withdrawn"], str(listed))
        pending = hq.post("/consent-requests", json={"topper_id": riya["id"], "version_id": version_id, "channels": ["instagram"],
                                                     "valid_until": until}).json()["token"]

        # ---- carousels and PDFs
        pages = [(POSTERS / name).read_bytes() for name in ("01-clean.png", "06-wrong-fee.png")]
        r = staff.post("/posters", data={"title": "Carousel", "channel": "print", "tagged_topper_ids": [riya["id"]]},
                       files=[("image", ("one.png", pages[0], "image/png")), ("image", ("two.png", pages[1], "image/png"))])
        check("branch staff upload a two-image carousel", r.status_code == 201, r.text[:200])
        carousel = r.json()
        v = carousel["versions"][-1]
        check("...it has two pages, each with its own image", v["source"] == "carousel" and len(v["pages"]) == 2
              and all(p["image_url"] for p in v["pages"]), str(v.get("source")))
        fees = [f for f in v["findings"] if f["rule_id"] == "FACT-02" and f["severity"] != "pass"]
        check("...and the wrong fee is found on page 2", bool(fees) and unstack_box(fees[0]["evidence"]["box_2d"])[0] == 1,
              str([(f["message"], f["evidence"].get("box_2d")) for f in fees]))
        buffer = io.BytesIO()
        images = [Image.open(io.BytesIO(p)).convert("RGB") for p in pages]
        images[0].save(buffer, "PDF", save_all=True, append_images=images[1:])
        r = staff.post("/posters", data={"title": "Brochure", "channel": "print", "tagged_topper_ids": [riya["id"]]},
                       files={"image": ("brochure.pdf", buffer.getvalue(), "application/pdf")})
        check("branch staff upload a PDF brochure", r.status_code == 201, r.text[:200])
        v = r.json()["versions"][-1]
        check("...each page is read and checked", v["source"] == "pdf" and len(v["pages"]) == 2, str(v.get("source")))
        too_many = [("image", (f"p{i}.png", pages[0], "image/png")) for i in range(11)]
        check("more than 10 images is refused", staff.post("/posters", data={"title": "Too long", "channel": "print"},
                                                            files=too_many).status_code == 422)
        if keep:
            KEPT.parent.mkdir(exist_ok=True)
            KEPT.write_text(json.dumps({"org": org, "org_id": org_id, "users": users, "consent_token": pending,
                                        "staff_email": staff_email, "staff_password": staff_password, "hq_email": email,
                                        "hq_password": password, "carousel_id": carousel["id"], "poster_id": poster["id"]}), encoding="utf-8")
            print(f"kept {org}; delete it with --cleanup")
    finally:
        if not keep:
            cleanup(org_id, users)
    failed = [label for ok, label in results if not ok]
    print(f"\n{len(results) - len(failed)} passed, {len(failed)} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
