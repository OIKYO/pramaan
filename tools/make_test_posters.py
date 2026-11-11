"""Generate the fictional test posters, with a fixture reading for each.

    backend\\.venv\\Scripts\\python tools\\make_test_posters.py

Writes
  test-posters/<name>.png                       the posters (1080 x 1350, Instagram portrait)
  test-posters/manifest.json                    upload details, and the checks each poster should fail
  backend/tests/fixtures/readings/<name>.json   what a perfect reader returns (used when READER_MODE=fixture)
  backend/tests/fixtures/readings/index.json    image SHA-256 -> fixture name

Fifty posters: clean ones, one poster per planted problem (several examples of each check), and a few
with two problems. Each says which checks must fail ("expect") and which AI flags are fair on it
("also"); the reliability report scores the live reader against them.
Every person, number and address is fictional (see backend/scripts/seed.py). People are drawn as
initials in a circle, never as faces. Text uses the Nirmala UI font that ships with Windows, which
covers Latin, the rupee sign and Devanagari. This Pillow build can't shape Indic scripts, so the Hindi
lines avoid conjuncts and vowel signs that are drawn before their consonant.
"""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "backend"))

from app.models import PosterReading  # noqa: E402
from pipeline.boxes import from_pixels  # noqa: E402
from scripts.seed import BRANCHES, HELPLINE  # noqa: E402

POSTERS_DIR = REPO / "test-posters"
READINGS_DIR = REPO / "backend" / "tests" / "fixtures" / "readings"
LOGO = REPO / "backend" / "assets" / "northfield-logo.png"
FONT = Path("C:/Windows/Fonts/Nirmala.ttc")

W, H = 1080, 1350
NAVY, CREAM, INK, TEAL, WHITE = "#1F3354", "#F8F6F1", "#111827", "#238A7D", "#FFFFFF"
LIME, PALE_GREY, PINK, PALE_YELLOW = "#A3E635", "#C9C9C9", "#FBCFE8", "#F1E7B8"
SILIGURI = next(b for b in BRANCHES if b["city"] == "Siliguri")
KOLKATA = next(b for b in BRANCHES if b["city"] == "Kolkata")

RIYA = dict(name="Riya Sen", rank=73, course="2-Year Classroom Programme", duration="2 years", paid="Paid")
ANANYA = dict(name="Ananya Roy", rank=58, course="2-Year Classroom Programme", duration="2 years", paid="Paid")
ALT_RIYA = ("Northfield Academy Siliguri poster: Riya Sen, AIR 73 in JEE Main 2026, from the 2-Year Classroom "
            "Programme, with the course fee and the branch phone number.")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size, index=1 if bold else 0)


class Poster:
    """Draws a poster and records, line by line, what a perfect reader would report."""

    def __init__(self, background: str):
        self.img = Image.new("RGB", (W, H), background)
        self.draw = ImageDraw.Draw(self.img)
        self.reading = {"text_blocks": [], "claims": [], "people": [], "numbers": [],
                        "registered_name_seen": False, "helpline_seen": False, "wording_flags": []}

    def text(self, x: int, y: int, text: str, size: int, fill: str, *, bold: bool = False, romanised: str = "",
             claim: bool = False, numbers=(), flag: dict | None = None) -> tuple[int, int, int, int]:
        f = font(size, bold)
        self.draw.text((x, y), text, font=f, fill=fill)
        bbox = self.draw.textbbox((x, y), text, font=f)
        box = from_pixels(*bbox, W, H)
        self.reading["text_blocks"].append({"text": text, "romanised": romanised, "box_2d": box})
        if claim:
            self.reading["claims"].append({"text": text, "box_2d": box})
        for kind, raw, value in numbers:  # each number gets a box around just its own characters
            start = x + self.draw.textlength(text[: text.index(raw)], font=f)
            self.reading["numbers"].append({"kind": kind, "raw_text": raw, "value": value,
                                            "box_2d": from_pixels(*self.draw.textbbox((start, y), raw, font=f), W, H)})
        if flag:
            self.reading["wording_flags"].append({"text": text, "box_2d": box, **flag})
        return bbox

    def person(self, y: int, name: str, rank: int, course: str, duration: str, paid: str) -> None:
        self.draw.ellipse((80, y, 230, y + 150), fill=TEAL)  # an initials badge, not a photo of anyone
        initials = "".join(part[0] for part in name.split())
        self.draw.text((155, y + 75), initials, font=font(54, True), fill=WHITE, anchor="mm")
        boxes = [
            self.text(270, y, name, 46, NAVY, bold=True),
            self.text(270, y + 62, f"AIR {rank} · JEE Main 2026", 32, INK, numbers=[("rank", str(rank), rank)]),
            self.text(270, y + 108, f"{course} · {duration} · {paid}", 28, INK),
        ]
        right, bottom = max(b[2] for b in boxes), max(y + 150, boxes[-1][3])
        self.reading["people"].append({
            "name": name, "romanised_name": "", "rank_text": f"AIR {rank}", "rank_value": rank,
            "course_text": course, "duration_text": duration, "paid_text": paid,
            "box_2d": from_pixels(80, y, right, bottom, W, H),
        })


def build(spec: dict) -> Poster:
    p = Poster(spec.get("background", CREAM))
    p.draw.rectangle((0, 0, W, 210), fill=NAVY)
    if spec.get("logo", True):
        p.img.paste(Image.open(LOGO).convert("RGB").resize((150, 150), Image.Resampling.LANCZOS), (60, 30))
    p.text(240, 45, "Northfield Academy", 56, WHITE, bold=True)
    p.text(240, 125, "Siliguri branch", 30, CREAM)

    headline = spec.get("headline", {"text": "Our JEE Main 2026 toppers"})
    p.text(80, 245, headline["text"], 58, headline.get("fill", NAVY), bold=True, romanised=headline.get("romanised", ""),
           claim=headline.get("claim", False), flag=headline.get("flag"))

    toppers = spec.get("toppers", [RIYA])
    for i, topper in enumerate(toppers):
        p.person(370 + i * 190, **topper)
    y = 370 + len(toppers) * 190 + 20

    stat, stat_value = spec.get("stat", ("42", 42))
    p.text(80, y, f"{stat} classroom students qualified JEE Main 2026", 36, NAVY, bold=True, claim=True,
           numbers=[("stat", stat, stat_value)])
    fee, fee_value = spec.get("fee", ("₹48,000", 48000))
    p.text(80, y + 70, f"2-Year Classroom Programme: {fee}", 34, INK, numbers=[("fee", fee, fee_value)])
    phone = spec.get("phone", SILIGURI["phone"])
    p.text(80, y + 130, f"Siliguri branch: {phone}", 34, INK, numbers=[("phone", phone, None)])
    for line in spec.get("extra_lines", []):
        p.text(80, line.pop("y"), line.pop("text"), line.pop("size", 44), line.pop("fill", NAVY), **line)

    p.text(80, 1130, "Ranks as declared in the official results. Students shown gave written consent.", 24,
           spec.get("disclaimer_fill", INK))
    p.draw.rectangle((0, 1190, W, H), fill=NAVY)
    if spec.get("footer", True):
        p.text(80, 1245, f"Northfield Academy Pvt. Ltd. · Helpline {HELPLINE}", 30, CREAM,
               numbers=[("phone", HELPLINE, None)])
        p.reading["registered_name_seen"] = p.reading["helpline_seen"] = True
    return p


POSTERS = [
    {"name": "01-clean", "title": "JEE Main 2026 toppers", "channel": "instagram",
     "toppers": [RIYA, ANANYA], "tags": ["Riya Sen", "Ananya Roy"],
     "caption": "Congratulations to Riya and Ananya on their JEE Main 2026 results!",
     "alt_text": ("Northfield Academy Siliguri poster: Riya Sen (AIR 73) and Ananya Roy (AIR 58) in JEE Main 2026, "
                  "both from the 2-Year Classroom Programme, with the course fee and the branch phone number."),
     "expect": [], "plants": "nothing: every check should pass"},
    {"name": "02-banned-claim", "title": "Admissions open", "channel": "instagram", "tags": ["Riya Sen"],
     "headline": {"text": "100% selection guaranteed", "claim": True}, "alt_text": ALT_RIYA,
     "expect": ["CCPA-01"], "also": ["AI-01", "BRAND-04"], "plants": "the banned claim “100% selection guaranteed”"},
    {"name": "03-wrong-rank", "title": "Riya's result", "channel": "instagram", "tags": ["Riya Sen"],
     "toppers": [{**RIYA, "rank": 37}], "alt_text": ALT_RIYA,
     "expect": ["CCPA-04"], "plants": "Riya Sen shown as AIR 37 (the register says AIR 73)"},
    {"name": "04-no-consent", "title": "Arjun's result", "channel": "print", "tags": ["Arjun Das"],
     "toppers": [dict(name="Arjun Das", rank=112, course="2-Year Classroom Programme", duration="2 years", paid="Paid")],
     "expect": ["CCPA-02"], "plants": "Arjun Das, who has no consent on file"},
    {"name": "05-wrong-course", "title": "Priya's result", "channel": "instagram", "tags": ["Priya Mondal"],
     "toppers": [dict(name="Priya Mondal", rank=205, course="2-Year Classroom Programme", duration="2 years", paid="Paid")],
     "alt_text": "Northfield Academy Siliguri poster celebrating Priya Mondal's JEE Main 2026 rank, with fee and phone.",
     "expect": ["CCPA-05"], "plants": "Priya Mondal presented as a paid classroom student (she took the free test series)"},
    {"name": "06-wrong-fee", "title": "Classroom fees", "channel": "instagram", "tags": ["Riya Sen"],
     "fee": ("₹45,000", 45000), "alt_text": ALT_RIYA,
     "expect": ["FACT-02"], "plants": "a fee of ₹45,000 (approved: ₹48,000)"},
    {"name": "07-wrong-phone", "title": "Call us", "channel": "instagram", "tags": ["Riya Sen"],
     "phone": "+91 10000 22109", "alt_text": ALT_RIYA,
     "expect": ["FACT-03"], "plants": "a phone number that isn't the Siliguri branch's"},
    {"name": "08-off-palette", "title": "Summer batch", "channel": "instagram", "tags": ["Riya Sen"],
     "background": LIME, "alt_text": ALT_RIYA,
     "expect": ["BRAND-02"], "plants": "a lime-green background outside the brand palette"},
    {"name": "09-low-contrast", "title": "Results poster", "channel": "instagram", "tags": ["Riya Sen"],
     "disclaimer_fill": PALE_GREY, "alt_text": ALT_RIYA,
     "expect": ["ACC-01"], "plants": "a pale grey disclaimer on the off-white background"},
    {"name": "10-hindi", "title": "Naya batch", "channel": "whatsapp", "tags": ["Riya Sen"],
     "headline": {"text": "नया बैच शुरू", "romanised": "Naya batch shuru"},
     "extra_lines": [{"y": 1040, "text": "सीट तय है!", "romanised": "Seat tay hai!", "flag": {
         "rule_id": "AI-01", "why": "Tells readers their seat is certain, which promises admission without saying 'guarantee'.",
         "suggested_rewrite": "दाखिले खुले हैं, सीटें सीमित हैं (Admissions open, seats are limited)"}}],
     "alt_text": "Northfield Academy Siliguri poster in Hindi announcing a new batch, with Riya Sen's JEE Main 2026 rank.",
     "expect": ["AI-01"], "also": ["BRAND-04"], "plants": "Hindi text with the disguised guarantee “सीट तय है!” (your seat is fixed)"},
    {"name": "11-old-consent", "title": "Karan's result", "channel": "print", "tags": ["Karan Thapa"],
     "toppers": [dict(name="Karan Thapa", rank=340, course="1-Year Crash Course", duration="1 year", paid="Paid")],
     "expect": ["CCPA-03"], "plants": "Karan Thapa, whose consent is dated before the result"},
]

PRIYA_FREE = dict(name="Priya Mondal", rank=205, course="All-India Test Series", duration="6 months", paid="Free")
ARJUN = dict(name="Arjun Das", rank=112, course="2-Year Classroom Programme", duration="2 years", paid="Paid")
ALT = "Northfield Academy Siliguri poster with a JEE Main 2026 result, the course fee and the branch phone number."
GUARANTEE_AI = ["AI-01", "BRAND-04"]  # fair AI flags on a planted guarantee


def line(text: str, y: int = 1000, size: int = 40, **extra) -> dict:
    return {"y": y, "text": text, "size": size, **extra}


def flag(rule_id: str, why: str) -> dict:
    return {"rule_id": rule_id, "why": why}


POSTERS += [
    # clean posters: nothing should fail
    {"name": "12-clean-ananya", "title": "Ananya's result", "channel": "instagram", "tags": ["Ananya Roy"],
     "toppers": [ANANYA], "alt_text": ALT, "expect": [], "plants": "nothing: Ananya Roy, a minor with guardian-signed consent"},
    {"name": "13-clean-print", "title": "Riya's result (print)", "channel": "print", "tags": ["Riya Sen"],
     "headline": {"text": "Congratulations, Riya Sen"}, "expect": [], "plants": "nothing: a print poster, which needs no alt text"},
    {"name": "14-clean-test-series", "title": "Priya's result", "channel": "instagram", "tags": ["Priya Mondal"],
     "toppers": [PRIYA_FREE], "alt_text": ALT, "expect": [], "plants": "nothing: Priya Mondal shown correctly as a free test-series student"},
    {"name": "15-clean-congrats", "title": "Congratulations", "channel": "whatsapp", "tags": ["Riya Sen", "Ananya Roy"],
     "toppers": [RIYA, ANANYA], "headline": {"text": "Congratulations to our achievers"}, "alt_text": ALT,
     "expect": [], "plants": "nothing: two toppers on WhatsApp"},
    {"name": "16-clean-offer", "title": "Early-bird offer", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Early-bird discount: 10% off till 30 November 2026"), line("T&C apply at the branch", 1060, 30)],
     "expect": [], "plants": "nothing: an offer with an end date and its terms"},
    {"name": "17-clean-date", "title": "New batch", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("New batch starts Monday, 7 December 2026")],
     "expect": [], "plants": "nothing: a future date on the right weekday"},
    {"name": "18-clean-hindi", "title": "Naya batch", "channel": "whatsapp", "tags": ["Riya Sen"], "alt_text": ALT,
     "headline": {"text": "नया बैच शुरू", "romanised": "Naya batch shuru"},
     "expect": [], "plants": "nothing: a Hindi headline with no promise"},
    # banned claims (CCPA-01)
    {"name": "19-banned-guaranteed-selection", "title": "JEE 2027", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "headline": {"text": "Guaranteed selection in JEE 2027", "claim": True},
     "expect": ["CCPA-01"], "also": GUARANTEE_AI, "plants": "the banned claim “Guaranteed selection”"},
    {"name": "20-banned-job", "title": "Careers", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("100% job placement after the course", claim=True)],
     "expect": ["CCPA-01"], "also": GUARANTEE_AI, "plants": "the banned claim “100% job”"},
    {"name": "21-banned-rank", "title": "Top ranks", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Guaranteed rank in the top 1000", claim=True)],
     "expect": ["CCPA-01"], "also": GUARANTEE_AI, "plants": "the banned claim “Guaranteed rank”"},
    {"name": "22-banned-hindi", "title": "Chayan", "channel": "whatsapp", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("100% चयन", romanised="100% chayan", claim=True)],
     "expect": ["CCPA-01"], "also": GUARANTEE_AI, "plants": "the banned Hindi claim “100% चयन” (100% selection)"},
    {"name": "23-banned-success", "title": "Results", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Guaranteed success for every student", claim=True)],
     "expect": ["CCPA-01"], "also": GUARANTEE_AI, "plants": "the banned claim “Guaranteed success”"},
    # ranks (CCPA-04)
    {"name": "24-wrong-rank-ananya", "title": "Ananya's result", "channel": "instagram", "tags": ["Ananya Roy"],
     "toppers": [{**ANANYA, "rank": 85}], "alt_text": ALT, "expect": ["CCPA-04"], "plants": "Ananya Roy shown as AIR 85 (the register says AIR 58)"},
    {"name": "25-wrong-rank-riya-7", "title": "Riya's result", "channel": "instagram", "tags": ["Riya Sen"],
     "toppers": [{**RIYA, "rank": 7}], "alt_text": ALT, "expect": ["CCPA-04"], "plants": "Riya Sen shown as AIR 7 (the register says AIR 73)"},
    {"name": "26-wrong-rank-priya", "title": "Priya's result", "channel": "instagram", "tags": ["Priya Mondal"],
     "toppers": [{**PRIYA_FREE, "rank": 250}], "alt_text": ALT, "expect": ["CCPA-04"], "plants": "Priya Mondal shown as AIR 250 (the register says AIR 205)"},
    # consent (CCPA-02)
    {"name": "27-no-consent-with-riya", "title": "Our toppers", "channel": "instagram", "tags": ["Riya Sen", "Arjun Das"],
     "toppers": [RIYA, ARJUN], "alt_text": ALT, "expect": ["CCPA-02"], "plants": "Arjun Das (no consent) beside Riya Sen"},
    {"name": "28-not-in-register", "title": "Meera's result", "channel": "print", "tags": [],
     "toppers": [dict(name="Meera Pillai", rank=91, course="2-Year Classroom Programme", duration="2 years", paid="Paid")],
     "expect": ["CCPA-02", "READ-03"], "plants": "Meera Pillai, who isn't in the register (so nobody could tag her)"},
    # details next to each person (CCPA-05)
    {"name": "29-wrong-duration", "title": "Riya's result", "channel": "instagram", "tags": ["Riya Sen"],
     "toppers": [{**RIYA, "duration": "1 year"}], "alt_text": ALT, "expect": ["CCPA-05"], "plants": "Riya Sen's course shown as 1 year (it's 2 years)"},
    {"name": "30-wrong-paid", "title": "Riya's result", "channel": "instagram", "tags": ["Riya Sen"],
     "toppers": [{**RIYA, "paid": "Free"}], "alt_text": ALT, "expect": ["CCPA-05"], "plants": "Riya Sen's paid course shown as free"},
    # results figures (CCPA-06)
    {"name": "31-wrong-stat", "title": "Our results", "channel": "instagram", "tags": ["Riya Sen"], "stat": ("45", 45),
     "alt_text": ALT, "expect": ["CCPA-06"], "plants": "45 students qualified (the approved figure is 42)"},
    {"name": "32-wrong-stat-high", "title": "Our results", "channel": "instagram", "tags": ["Riya Sen"], "stat": ("420", 420),
     "alt_text": ALT, "expect": ["CCPA-06"], "plants": "420 students qualified (the approved figure is 42)"},
    # courses, fees and contacts (FACT-01 to FACT-03)
    {"name": "33-wrong-course-duration", "title": "Crash course", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Crash Course: 8 months of classes", size=34)],
     "expect": ["FACT-01"], "plants": "the 1-Year Crash Course described as 8 months"},
    {"name": "34-wrong-fee-high", "title": "Fees", "channel": "instagram", "tags": ["Riya Sen"], "fee": ("₹50,000", 50000),
     "alt_text": ALT, "expect": ["FACT-02"], "plants": "a fee of ₹50,000 (approved: ₹48,000)"},
    {"name": "35-wrong-fee-typo", "title": "Fees", "channel": "instagram", "tags": ["Riya Sen"], "fee": ("₹4,800", 4800),
     "alt_text": ALT, "expect": ["FACT-02"], "plants": "a fee of ₹4,800, a missing zero (approved: ₹48,000)"},
    {"name": "36-other-branch-phone", "title": "Call us", "channel": "instagram", "tags": ["Riya Sen"], "phone": KOLKATA["phone"],
     "alt_text": ALT, "expect": ["FACT-03"], "plants": "the Kolkata branch's phone on a Siliguri poster"},
    # brand (BRAND-01 to BRAND-04)
    {"name": "37-no-logo", "title": "Results", "channel": "instagram", "tags": ["Riya Sen"], "logo": False,
     "alt_text": ALT, "expect": ["BRAND-01"], "plants": "no logo"},
    {"name": "38-off-palette-pink", "title": "Festive batch", "channel": "instagram", "tags": ["Riya Sen"], "background": PINK,
     "alt_text": ALT, "expect": ["BRAND-02"], "plants": "a pink background outside the brand palette"},
    {"name": "39-no-registered-name", "title": "Results", "channel": "instagram", "tags": ["Riya Sen"], "footer": False,
     "alt_text": ALT, "expect": ["BRAND-03"], "plants": "no registered name or helpline"},
    {"name": "40-pushy-tone", "title": "Hurry", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Hurry! Join now or regret it forever!", flag=flag("BRAND-04", "Pressures and frightens readers, against the tone notes."))],
     "expect": ["BRAND-04"], "plants": "pressuring words: “Join now or regret it forever!”"},
    # accessibility (ACC-01, ACC-02)
    {"name": "41-low-contrast-headline", "title": "Results", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "headline": {"text": "Our JEE Main 2026 toppers", "fill": PALE_YELLOW},
     "expect": ["ACC-01"], "plants": "a pale yellow headline on the off-white background"},
    {"name": "42-no-alt-text", "title": "Results", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": "",
     "expect": ["ACC-02"], "plants": "an Instagram post with no alt text"},
    # disguised guarantees (AI-01)
    {"name": "43-selection-pakka", "title": "Selection", "channel": "whatsapp", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Selection pakka with Northfield!", flag=flag("AI-01", "Says selection is certain without the word 'guarantee'."))],
     "expect": ["AI-01"], "also": ["BRAND-04"], "plants": "the disguised guarantee “Selection pakka”"},
    {"name": "44-seat-confirmed", "title": "Seats", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Your IIT seat is confirmed here", flag=flag("AI-01", "Promises an IIT seat, which nobody can promise."))],
     "expect": ["AI-01"], "also": ["BRAND-04"], "plants": "the disguised guarantee “Your IIT seat is confirmed”"},
    # dates (EVENT-01 to EVENT-03)
    {"name": "45-wrong-weekday", "title": "New batch", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("New batch starts Monday, 30 December 2026")],
     "expect": ["EVENT-02"], "plants": "Monday, 30 December 2026 (it's a Wednesday)"},
    {"name": "46-passed-deadline", "title": "Admissions", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Last date to apply: 31 October 2026")],
     "expect": ["EVENT-03"], "plants": "a last date that has passed (31 October 2026)"},
    {"name": "47-impossible-date", "title": "Admissions", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Admissions close on 31 November 2026")],
     "expect": ["EVENT-01"], "plants": "31 November, a date that doesn't exist"},
    # offers and permissions (OFFER-01, OFFER-02, RIGHTS-01)
    {"name": "48-offer-no-end", "title": "Offer", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Early-bird discount: 20% off"), line("T&C apply at the branch", 1060, 30)],
     "expect": ["OFFER-01"], "plants": "an offer with no end date"},
    {"name": "49-offer-no-terms", "title": "Scholarships", "channel": "instagram", "tags": ["Riya Sen"], "alt_text": ALT,
     "extra_lines": [line("Scholarships up to 50% till 30 November 2026", size=36)],
     "expect": ["OFFER-02"], "plants": "a scholarship that doesn't say who qualifies or where the terms are"},
    {"name": "50-two-problems", "title": "Riya's result", "channel": "instagram", "tags": ["Riya Sen"],
     "toppers": [{**RIYA, "rank": 37}], "fee": ("₹45,000", 45000), "alt_text": ALT,
     "expect": ["CCPA-04", "FACT-02"], "plants": "two problems: Riya Sen as AIR 37, and a fee of ₹45,000"},
]


def main() -> None:
    if not FONT.exists():
        sys.exit(f"Needs the Nirmala UI font ({FONT}), which ships with Windows 10 and 11.")
    POSTERS_DIR.mkdir(exist_ok=True)
    READINGS_DIR.mkdir(parents=True, exist_ok=True)
    index, manifest = {}, []
    for spec in POSTERS:
        poster = build({**spec, "extra_lines": [dict(line) for line in spec.get("extra_lines", [])]})
        reading = PosterReading.model_validate(poster.reading)  # the fixture must match the schema
        png = POSTERS_DIR / f"{spec['name']}.png"
        poster.img.save(png, format="PNG")
        sha = hashlib.sha256(png.read_bytes()).hexdigest()
        (READINGS_DIR / f"{spec['name']}.json").write_text(
            json.dumps(reading.model_dump(mode="json"), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        index[sha] = spec["name"]
        manifest.append({
            "name": spec["name"], "file": png.name, "title": spec["title"], "channel": spec["channel"],
            "caption": spec.get("caption", ""), "alt_text": spec.get("alt_text", ""), "tags": spec["tags"],
            "expect": spec["expect"], "also": spec.get("also", []), "plants": spec["plants"], "sha256": sha,
        })
        print(f"{png.name}: expects {spec['expect'] or 'all pass'}")
    (READINGS_DIR / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    (POSTERS_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
                                               encoding="utf-8")


if __name__ == "__main__":
    main()
