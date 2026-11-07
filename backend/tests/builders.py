"""Test data built from the same constants as scripts/seed.py, so tests and the demo can't drift."""

from datetime import date

from app.models import (
    BrandKit, Branch, ContrastReading, Course, PaletteCluster, PosterReading, ResultStat, Topper, VisualReport,
)
from pipeline.match import match_people
from rules.registry import RuleContext
from scripts import seed

TODAY = date(2026, 11, 7)
FACTS_VALID_UNTIL = date.fromisoformat(seed.FACTS_VALID_UNTIL)


def slug(name: str) -> str:
    return name.lower().replace(" ", "-")


COURSES = [
    Course(id=f"course-{slug(c['name'])}", valid_until=FACTS_VALID_UNTIL, **c) for c in seed.COURSES
]
COURSE_ID = {c.name: c.id for c in COURSES}

TOPPERS = {
    f"topper-{slug(t['full_name'])}": Topper(
        id=f"topper-{slug(t['full_name'])}",
        full_name=t["full_name"],
        name_variants=t["name_variants"],
        exam="JEE Main",
        exam_year=2026,
        rank=t["rank"],
        result_date=date.fromisoformat(seed.RESULT_DATE),
        course_id=COURSE_ID[t["course"]],
        is_minor=t.get("is_minor", False),
        guardian_signed=t.get("guardian_signed", False),
        consent_path=f"{slug(t['full_name'])}.pdf" if "consent_date" in t else None,
        consent_date=date.fromisoformat(t["consent_date"]) if "consent_date" in t else None,
        consent_channels=t.get("consent_channels", []),
        consent_valid_until=date(2027, 5, 1) if "consent_date" in t else None,
    )
    for t in seed.TOPPERS
}

STATS = [
    ResultStat(id=f"stat-{i}", valid_until=FACTS_VALID_UNTIL, **s) for i, s in enumerate(seed.RESULT_STATS)
]
BRAND_KIT = BrandKit(**{k: v for k, v in seed.BRAND_KIT.items() if k != "id"}, logo_path="northfield-logo.png")
SILIGURI = next(b for b in seed.BRANCHES if b["city"] == "Siliguri")
BRANCH = Branch(id="branch-siliguri", **SILIGURI)


def topper_id(full_name: str) -> str:
    return f"topper-{slug(full_name)}"


def clean_reading() -> PosterReading:
    """A Siliguri poster that passes every check: Riya Sen with full details, approved facts."""
    return PosterReading.model_validate({
        "text_blocks": [
            {"text": "Northfield Academy", "box_2d": [40, 200, 90, 800]},
            {"text": "JEE Main 2026: our toppers", "box_2d": [110, 100, 160, 900]},
            {"text": "Riya Sen", "box_2d": [300, 100, 340, 450]},
            {"text": "AIR 73 · JEE Main 2026", "box_2d": [345, 100, 375, 450]},
            {"text": "2-Year Classroom Programme · 2 years · Paid", "box_2d": [380, 100, 410, 600]},
            {"text": "42 classroom students qualified JEE Main 2026", "box_2d": [500, 100, 540, 900]},
            {"text": "2-Year Classroom Programme: ₹48,000", "box_2d": [600, 100, 640, 900]},
            {"text": f"Call {SILIGURI['phone']}", "box_2d": [700, 100, 740, 600]},
            {"text": f"Northfield Academy Pvt. Ltd. · Helpline {seed.HELPLINE}", "box_2d": [920, 100, 960, 900]},
        ],
        "claims": [{"text": "42 classroom students qualified JEE Main 2026", "box_2d": [500, 100, 540, 900]}],
        "people": [{
            "name": "Riya Sen", "rank_text": "AIR 73", "rank_value": 73,
            "course_text": "2-Year Classroom Programme", "duration_text": "2 years", "paid_text": "Paid",
            "box_2d": [300, 100, 410, 600],
        }],
        "numbers": [
            {"kind": "rank", "raw_text": "AIR 73", "value": 73, "box_2d": [345, 100, 375, 250]},
            {"kind": "stat", "raw_text": "42", "value": 42, "box_2d": [500, 100, 540, 160]},
            {"kind": "fee", "raw_text": "₹48,000", "value": 48000, "box_2d": [600, 600, 640, 900]},
            {"kind": "phone", "raw_text": SILIGURI["phone"], "box_2d": [700, 200, 740, 600]},
            {"kind": "phone", "raw_text": seed.HELPLINE, "box_2d": [920, 600, 960, 900]},
        ],
        "registered_name_seen": True,
        "helpline_seen": True,
        "wording_flags": [],
    })


def clean_visual(blocks: int = 9) -> VisualReport:
    return VisualReport(
        width=1080, height=1350,
        palette=[PaletteCluster(hex="#F8F6F1", share=0.62, delta_e=0.5),
                 PaletteCluster(hex="#1F3354", share=0.30, delta_e=1.2)],
        logo_score=0.93,
        contrast=[ContrastReading(block_index=i, ratio=9.0, fg="#1F3354", bg="#F8F6F1") for i in range(blocks)],
    )


def make_ctx(reading: PosterReading | None = None, *, tagged: list[str] | None = None, channel: str = "print",
             caption: str = "", alt_text: str = "", visual: VisualReport | None | str = "clean",
             today: date = TODAY, toppers: dict[str, Topper] | None = None, courses: list[Course] | None = None,
             stats: list[ResultStat] | None = None) -> RuleContext:
    reading = reading or clean_reading()
    toppers = toppers or TOPPERS
    matches = match_people(reading, list(toppers.values()))
    return RuleContext(
        reading=reading,
        people=matches,
        tagged_topper_ids=tagged if tagged is not None else [m.topper_id for m in matches if m.topper_id],
        brand_kit=BRAND_KIT,
        courses=courses or COURSES,
        result_stats=STATS if stats is None else stats,
        toppers=toppers,
        branch=BRANCH,
        channel=channel,
        caption=caption,
        alt_text=alt_text,
        visual=clean_visual(len(reading.text_blocks)) if visual == "clean" else visual,
        today=today,
    )


def with_person(reading: PosterReading, **changes) -> PosterReading:
    """The reading with the first person's fields changed."""
    person = reading.people[0].model_copy(update=changes)
    return reading.model_copy(update={"people": [person]})
