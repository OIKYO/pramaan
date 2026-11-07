"""Create the demo users and the fictional Northfield Academy data.

    cd backend
    python -m scripts.seed

Safe to run again: everything is upserted by a natural key. Every person, institute, address and
phone number here is fictional. Phone numbers start with +91 1, a range India does not give to
subscribers, so none of them can belong to a real person.
"""

import io
import json
from datetime import date

from PIL import Image, ImageDraw, ImageFont

from app.config import BACKEND_DIR, get_settings
from app.db import get_db

LOGO = BACKEND_DIR / "assets" / "northfield-logo.png"
RULE_PACK = BACKEND_DIR / "rules" / "rule_pack.json"

HELPLINE = "+91 10000 10000"

# The demo organisation. Its id is fixed so the migration and the seed agree on it.
ORG_ID = "00000000-0000-4000-8000-000000000001"
ORG_NAME = "Northfield Academy"

BRANCHES = [
    {"name": "Northfield Kolkata", "city": "Kolkata", "phone": "+91 10000 22101",
     "address": "3rd floor, 21 Lake Terrace, Kolkata 700029"},
    {"name": "Northfield Siliguri", "city": "Siliguri", "phone": "+91 10000 22102",
     "address": "2nd floor, 14 Hill Cart Road, Siliguri 734001"},
    {"name": "Northfield Patna", "city": "Patna", "phone": "+91 10000 22103",
     "address": "1st floor, 8 Boring Canal Road, Patna 800001"},
    {"name": "Northfield Ranchi", "city": "Ranchi", "phone": "+91 10000 22104",
     "address": "5 Circular Road, Ranchi 834001"},
]

USERS = [
    {"email": "staff.siliguri@pramaan.demo", "full_name": "Tara Ghosh", "role": "branch_staff",
     "branch": "Northfield Siliguri"},
    {"email": "regional.east@pramaan.demo", "full_name": "Vikram Bose", "role": "regional_manager",
     "region": "East"},
    {"email": "hq@pramaan.demo", "full_name": "Meera Iyer", "role": "head_office"},
    # A second branch account, used to test that branches can't see each other's posters.
    {"email": "staff.kolkata@pramaan.demo", "full_name": "Rahul Sarkar", "role": "branch_staff",
     "branch": "Northfield Kolkata"},
]

FACTS_VALID_UNTIL = "2027-03-31"
SOURCE = "Northfield fee and results circular 2026-27 (fictional)"

COURSES = [
    {"name": "2-Year Classroom Programme", "aliases": ["2-year classroom", "two-year classroom programme",
     "classroom programme", "2 year classroom"], "course_type": "classroom", "duration_label": "2 years",
     "duration_months": 24, "fee_inr": 48000, "is_paid": True},
    {"name": "1-Year Crash Course", "aliases": ["crash course", "1-year crash", "one-year crash course"],
     "course_type": "crash", "duration_label": "1 year", "duration_months": 12, "fee_inr": 30000,
     "is_paid": True},
    {"name": "All-India Test Series", "aliases": ["test series", "AITS", "all india test series"],
     "course_type": "test_series", "duration_label": "6 months", "duration_months": 6, "fee_inr": 0,
     "is_paid": False},
]

RESULT_STATS = [
    {"label": "Classroom students who qualified JEE Main 2026", "value": 42, "exam": "JEE Main", "year": 2026},
]

RESULT_DATE = "2026-04-19"
TOPPERS = [
    # Valid consent.
    {"full_name": "Riya Sen", "name_variants": ["Ria Sen", "Riya S."], "rank": 73,
     "course": "2-Year Classroom Programme", "consent_date": "2026-05-02",
     "consent_channels": ["print", "instagram", "whatsapp"]},
    # No consent on file.
    {"full_name": "Arjun Das", "name_variants": ["Arjun D."], "rank": 112, "course": "2-Year Classroom Programme"},
    # Valid consent, but she only took the free test series.
    {"full_name": "Priya Mondal", "name_variants": ["Priya Mandal"], "rank": 205,
     "course": "All-India Test Series", "consent_date": "2026-05-04",
     "consent_channels": ["print", "instagram", "whatsapp"]},
    # Consent dated before the result was declared.
    {"full_name": "Karan Thapa", "name_variants": ["Karan T."], "rank": 340, "course": "1-Year Crash Course",
     "consent_date": "2026-03-30", "consent_channels": ["print", "instagram", "whatsapp"]},
    # A minor, with guardian-signed consent.
    {"full_name": "Ananya Roy", "name_variants": ["Ananya R."], "rank": 58, "course": "2-Year Classroom Programme",
     "is_minor": True, "guardian_signed": True, "consent_date": "2026-05-10",
     "consent_channels": ["print", "instagram", "whatsapp"]},
]

BRAND_KIT = {
    "org_id": ORG_ID,
    "registered_name": "Northfield Academy Pvt. Ltd.",
    "helpline": HELPLINE,
    "palette": ["#1F3354", "#F8F6F1", "#FFFFFF", "#238A7D", "#E0A526", "#111827"],
    "banned_phrases": ["rank guaranteed", "assured selection"],
    "tone_notes": (
        "Warm, factual and encouraging. Credit students' own effort. "
        "No fear or pressure ('last chance', 'don't fall behind'), no superlatives such as "
        "'best' or 'No. 1' without proof, and no promises about results."
    ),
}


def ensure_user(db, email: str, password: str, full_name: str) -> str:
    """Create the auth user, or reset its password if it already exists. Returns the user id."""
    existing = {u.email: u for u in db.auth.admin.list_users()}
    if email in existing:
        user_id = existing[email].id
        db.auth.admin.update_user_by_id(user_id, {"password": password, "user_metadata": {"full_name": full_name}})
        return user_id
    created = db.auth.admin.create_user({
        "email": email, "password": password, "email_confirm": True, "user_metadata": {"full_name": full_name},
    })
    return created.user.id


def consent_pdf(topper: dict) -> bytes:
    """A one-page fictional consent form, so the consent bucket has something real to serve."""
    page = Image.new("RGB", (1240, 1754), "white")
    d = ImageDraw.Draw(page)
    big, body = ImageFont.load_default(size=44), ImageFont.load_default(size=30)
    d.text((100, 120), "Consent to publish results (fictional demo document)", font=big, fill="black")
    lines = [
        f"Student: {topper['full_name']}",
        f"Result: JEE Main 2026, AIR {topper['rank']}",
        f"Consent date: {topper['consent_date']}",
        f"Channels: {', '.join(topper['consent_channels'])}",
        f"Valid until: {topper.get('consent_valid_until', '2027-05-01')}",
        "Guardian signature: " + ("signed" if topper.get("guardian_signed") else "not required"),
        "",
        "This document is fictional and was generated for the Pramaan demo.",
    ]
    for i, line in enumerate(lines):
        d.text((100, 260 + i * 56), line, font=body, fill="black")
    buf = io.BytesIO()
    page.save(buf, format="PDF")
    return buf.getvalue()


def upload(db, bucket: str, path: str, data: bytes, content_type: str) -> str:
    db.storage.from_(bucket).upload(path, data, {"content-type": content_type, "upsert": "true"})
    return path


def main() -> None:
    settings = get_settings()
    if not settings.demo_password:
        raise SystemExit("Set DEMO_PASSWORD in backend/.env first.")
    db = get_db()

    db.table("organisations").upsert({
        "id": ORG_ID, "name": ORG_NAME, "industry_group": "education", "industry": "Coaching Institutes",
        "org_type": "coaching", "focus": ["admissions", "results"],
        "rulebooks": ["brand", "contacts", "claims", "offerings", "figures", "people", "rankings"],
    }).execute()
    region = db.table("regions").upsert({"org_id": ORG_ID, "name": "East"}, on_conflict="org_id,name").execute().data[0]
    branches = {}
    for branch in BRANCHES:
        row = db.table("branches").upsert({**branch, "org_id": ORG_ID, "region_id": region["id"]},
                                          on_conflict="org_id,name").execute()
        branches[branch["name"]] = row.data[0]["id"]
    print(f"region East with {len(branches)} branches")

    for user in USERS:
        user_id = ensure_user(db, user["email"], settings.demo_password, user["full_name"])
        db.table("profiles").upsert({
            "id": user_id,
            "org_id": ORG_ID,
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "branch_id": branches.get(user.get("branch", "")),
            "region_id": region["id"] if user["role"] == "regional_manager" else None,
        }).execute()
        print(f"user {user['email']} ({user['role']})")

    logo_path = upload(db, "brand", f"{ORG_ID}/northfield-logo.png", LOGO.read_bytes(), "image/png")
    db.table("brand_kit").upsert({**BRAND_KIT, "logo_path": logo_path}).execute()
    print("brand kit")

    courses = {}
    for course in COURSES:
        row = db.table("courses").upsert(
            {**course, "org_id": ORG_ID, "valid_until": FACTS_VALID_UNTIL, "source": SOURCE},
            on_conflict="org_id,name").execute()
        courses[course["name"]] = row.data[0]["id"]
    for stat in RESULT_STATS:
        db.table("result_stats").upsert(
            {**stat, "org_id": ORG_ID, "valid_until": FACTS_VALID_UNTIL, "source": SOURCE},
            on_conflict="org_id,label").execute()
    print(f"{len(courses)} courses, {len(RESULT_STATS)} result figure")

    hq_id = next(u.id for u in db.auth.admin.list_users() if u.email == "hq@pramaan.demo")
    for topper in TOPPERS:
        has_consent = "consent_date" in topper
        row = {
            "org_id": ORG_ID,
            "full_name": topper["full_name"],
            "name_variants": topper["name_variants"],
            "exam": "JEE Main",
            "exam_year": 2026,
            "rank": topper["rank"],
            "result_date": RESULT_DATE,
            "course_id": courses[topper["course"]],
            "is_minor": topper.get("is_minor", False),
            "guardian_signed": topper.get("guardian_signed", False),
            "consent_date": topper.get("consent_date"),
            "consent_channels": topper.get("consent_channels", []),
            "consent_valid_until": "2027-05-01" if has_consent else None,
            "consent_path": None,
            "verified_by": hq_id,
            "verified_at": f"{date(2026, 5, 15).isoformat()}T10:00:00+05:30",
        }
        if has_consent:
            slug = topper["full_name"].lower().replace(" ", "-")
            row["consent_path"] = upload(db, "consent", f"{ORG_ID}/{slug}.pdf", consent_pdf(topper), "application/pdf")
        db.table("toppers").upsert(row, on_conflict="org_id,full_name").execute()
    print(f"{len(TOPPERS)} toppers")

    if RULE_PACK.exists():
        rules = json.loads(RULE_PACK.read_text(encoding="utf-8"))["rules"]
        db.table("rule_settings").upsert(
            [{"org_id": ORG_ID, "rule_id": r["id"], "enabled": r.get("enabled", True)} for r in rules],
            on_conflict="org_id,rule_id", ignore_duplicates=True,
        ).execute()
        print(f"{len(rules)} rule settings")

    print("Seed complete.")


if __name__ == "__main__":
    main()
