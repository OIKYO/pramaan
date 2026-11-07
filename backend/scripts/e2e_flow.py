"""Run the Round 2 demo flow against a running API, as the real demo users.

    cd backend
    python -m scripts.e2e_flow                          # against http://localhost:8000
    python -m scripts.e2e_flow https://<render-url>     # against the deployed API
    python -m scripts.e2e_flow --keep                   # leave the posters in place for a demo

Upload a poster with a wrong rank -> checks block it -> submit -> approval refused -> sent back ->
upload the fixed version -> a reviewer confirms anything that needs a person -> regional approves ->
head office gives final approval. Along the way it checks that the forbidden moves are refused.
"""

import os
import sys
from pathlib import Path

import httpx

from app.config import REPO_DIR, get_settings, load_env_file
from app.db import get_db

settings = get_settings()
load_env_file(REPO_DIR / "frontend" / ".env")
PUBLISHABLE = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
POSTERS = REPO_DIR / "test-posters"
results: list[tuple[bool, str]] = []


def check(label: str, ok: bool, extra: str = "") -> None:
    results.append((ok, label))
    print(("PASS " if ok else "FAIL ") + label + (f"  ({extra})" if extra and not ok else ""))


def report_non_json(response: httpx.Response) -> None:
    """A crashed or restarting server answers with a proxy page, not JSON. Say so plainly."""
    if "application/json" not in response.headers.get("content-type", ""):
        response.read()
        print(f"NOTE {response.request.method} {response.request.url.path} answered HTTP "
              f"{response.status_code}, not JSON: {response.text[:200]!r}")


class User:
    def __init__(self, api: str, email: str):
        token = httpx.post(f"{settings.supabase_url}/auth/v1/token?grant_type=password",
                           headers={"apikey": PUBLISHABLE},
                           json={"email": email, "password": settings.demo_password}).json()["access_token"]
        self.client = httpx.Client(base_url=api, headers={"Authorization": f"Bearer {token}"}, timeout=180,
                                   event_hooks={"response": [report_non_json]})

    def upload(self, path: str, file: str, **form) -> httpx.Response:
        data = {k: v for k, v in form.items() if k != "tagged_topper_ids"}
        files = [("image", (file, (POSTERS / file).read_bytes(), "image/png"))]
        files += [("tagged_topper_ids", (None, t)) for t in form.get("tagged_topper_ids", [])]
        return self.client.post(path, data=data, files=files)

    def post(self, path: str, body: dict | None = None) -> httpx.Response:
        return self.client.post(path, json=body)

    def get(self, path: str) -> httpx.Response:
        return self.client.get(path)


def open_findings(detail: dict, *severities: str) -> list[dict]:
    current = next(v for v in detail["versions"] if v["version"] == detail["current_version"])
    return [f for f in current["findings"] if f["status"] == "open" and f["severity"] in severities]


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    api = (args[0] if args else "http://localhost:8000").rstrip("/")
    keep = "--keep" in sys.argv
    db = get_db()
    riya = db.table("toppers").select("id").eq("full_name", "Riya Sen").single().execute().data["id"]
    ananya = db.table("toppers").select("id").eq("full_name", "Ananya Roy").single().execute().data["id"]
    arjun = db.table("toppers").select("id").eq("full_name", "Arjun Das").single().execute().data["id"]

    staff = User(api, "staff.siliguri@pramaan.demo")
    other_staff = User(api, "staff.kolkata@pramaan.demo")
    regional = User(api, "regional.east@pramaan.demo")
    hq = User(api, "hq@pramaan.demo")
    created: list[str] = []

    try:
        check("health check needs no login", httpx.get(f"{api}/health").json()["ok"] is True)
        check("signed-out requests are refused", httpx.get(f"{api}/rules").status_code == 401)
        check("the rule pack has 17 checks", len(staff.get("/rules").json()["rules"]) == 17)
        check("regional managers can't upload posters",
              regional.upload("/posters", "01-clean.png", title="x", channel="print").status_code == 403)

        # 1. Upload a poster with Riya's rank wrong.
        r = staff.upload("/posters", "03-wrong-rank.png", title="Riya's result (e2e)", channel="instagram",
                         alt_text="Northfield Siliguri poster: Riya Sen's JEE Main 2026 result with fee and phone.",
                         tagged_topper_ids=[riya])
        check("staff upload a poster and it's checked", r.status_code == 201 and r.json()["status"] == "checked", r.text[:300])
        poster = r.json()
        pid = poster["id"]
        created.append(pid)
        blocks = open_findings(poster, "block")
        check("the wrong rank is blocked with the fix from the register",
              any(f["rule_id"] == "CCPA-04" and f["suggested_fix"] == "Change the rank to AIR 73." for f in blocks))
        check("every check left a row, passes included",
              len({f["rule_id"] for f in poster["versions"][0]["findings"]}) == 20)
        check("the poster image comes back as a signed URL",
              httpx.get(poster["versions"][0]["image_url"]).status_code == 200)
        check("another branch can't open the poster", other_staff.get(f"/posters/{pid}").status_code == 404)

        # 2. Submit, try to approve, send back.
        check("staff submit for review", staff.post(f"/posters/{pid}/submit").json()["review_stage"] == "regional")
        r = regional.post(f"/posters/{pid}/review", {"action": "approve"})
        check("approval is refused while a block is open", r.status_code == 409, r.text[:200])
        r = regional.post(f"/posters/{pid}/review", {"action": "send_back"})
        check("sending back needs a comment", r.status_code == 422)
        r = regional.post(f"/posters/{pid}/review", {"action": "send_back", "comment": "Riya's rank is AIR 73, not 37."})
        check("regional sends it back", r.json()["status"] == "changes_requested")

        # 3. Upload the fixed version (the clean poster) and submit again.
        r = staff.upload(f"/posters/{pid}/versions", "01-clean.png", tagged_topper_ids=[riya, ananya],
                         alt_text="Northfield Siliguri poster: Riya Sen and Ananya Roy, JEE Main 2026, with fee and phone.",
                         caption="Congratulations to Riya and Ananya on their JEE Main 2026 results!")
        detail = r.json()
        check("the fixed version is checked as version 2", r.status_code == 201 and detail["current_version"] == 2, r.text[:300])
        check("the fixed version has no blocking code findings", not open_findings(detail, "block"))
        staff.post(f"/posters/{pid}/submit")

        # 4. A reviewer confirms anything that needs a person (e.g. the second read, if Tesseract is missing).
        for finding in open_findings(staff.get(f"/posters/{pid}").json(), "needs_human"):
            r = regional.post(f"/findings/{finding['id']}/resolve", {"note": "Checked the numbers on the poster by eye."})
            check(f"regional confirms {finding['rule_id']}", r.status_code == 200, r.text[:200])

        # 5. Approve at both stages.
        r = regional.post(f"/posters/{pid}/review", {"action": "approve", "comment": "Looks right."})
        check("regional approves: on to head office", r.json().get("review_stage") == "head_office", r.text[:200])
        r = hq.post(f"/posters/{pid}/review", {"action": "approve"})
        check("head office gives final approval", r.json().get("status") == "approved", r.text[:200])
        actions = [rv["action"] for rv in r.json()["reviews"]]
        check("every step is in the history", actions[:4] == ["created", "checked", "submitted", "sent_back"]
              and actions[-2:] == ["approved", "final_approved"], str(actions))

        # 6. Overrides: only head office, only with a reason.
        r = staff.upload("/posters", "04-no-consent.png", title="Arjun's result (e2e)", channel="print",
                         tagged_topper_ids=[arjun])
        pid2 = r.json()["id"]
        created.append(pid2)
        staff.post(f"/posters/{pid2}/submit")
        consent = next(f for f in open_findings(r.json(), "block") if f["rule_id"] == "CCPA-02")
        check("regional can't override", regional.post(f"/findings/{consent['id']}/override", {"note": "ok"}).status_code == 403)
        r = hq.post(f"/findings/{consent['id']}/override", {"note": "Signed consent received by post; scan to follow."})
        overridden = [f for f in r.json()["versions"][0]["findings"] if f["id"] == consent["id"]][0]
        check("head office overrides with a reason", overridden["status"] == "overridden")

        # 7. Consent files and insights.
        r = hq.get(f"/toppers/{riya}/consent-url")
        check("head office gets a short-lived consent link", r.status_code == 200 and httpx.get(r.json()["url"]).status_code == 200)
        check("regional can't open consent files", regional.get(f"/toppers/{riya}/consent-url").status_code == 403)
        r = hq.get("/insights")
        check("head office sees insights", r.status_code == 200 and r.json()["total_posters"] >= 2, r.text[:200])
        check("insights are head office only", regional.get("/insights").status_code == 403)
    finally:
        if not keep:
            for pid in created:
                for v in db.table("poster_versions").select("image_path").eq("poster_id", pid).execute().data:
                    db.storage.from_("posters").remove([v["image_path"]])
                db.table("posters").delete().eq("id", pid).execute()

    failed = [label for ok, label in results if not ok]
    print(f"\n{len(results) - len(failed)} passed, {len(failed)} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
