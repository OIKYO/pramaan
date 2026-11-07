"""Generate the fictional test posters, with a fixture reading for each.

    backend\\.venv\\Scripts\\python tools\\make_test_posters.py

Writes
  test-posters/<name>.png                       the posters (1080 x 1350, Instagram portrait)
  test-posters/manifest.json                    upload details, and the checks each poster should fail
  backend/tests/fixtures/readings/<name>.json   what a perfect reader returns (used when READER_MODE=fixture)
  backend/tests/fixtures/readings/index.json    image SHA-256 -> fixture name

One clean poster, then one poster per planted problem, so each problem is easy to attribute.
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
LIME, PALE_GREY = "#A3E635", "#C9C9C9"
SILIGURI = next(b for b in BRANCHES if b["city"] == "Siliguri")

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
    p.img.paste(Image.open(LOGO).convert("RGB").resize((150, 150), Image.Resampling.LANCZOS), (60, 30))
    p.text(240, 45, "Northfield Academy", 56, WHITE, bold=True)
    p.text(240, 125, "Siliguri branch", 30, CREAM)

    headline = spec.get("headline", {"text": "Our JEE Main 2026 toppers"})
    p.text(80, 245, headline["text"], 58, NAVY, bold=True, romanised=headline.get("romanised", ""),
           claim=headline.get("claim", False), flag=headline.get("flag"))

    toppers = spec.get("toppers", [RIYA])
    for i, topper in enumerate(toppers):
        p.person(370 + i * 190, **topper)
    y = 370 + len(toppers) * 190 + 20

    p.text(80, y, "42 classroom students qualified JEE Main 2026", 36, NAVY, bold=True, claim=True,
           numbers=[("stat", "42", 42)])
    fee, fee_value = spec.get("fee", ("₹48,000", 48000))
    p.text(80, y + 70, f"2-Year Classroom Programme: {fee}", 34, INK, numbers=[("fee", fee, fee_value)])
    phone = spec.get("phone", SILIGURI["phone"])
    p.text(80, y + 130, f"Siliguri branch: {phone}", 34, INK, numbers=[("phone", phone, None)])
    for line in spec.get("extra_lines", []):
        p.text(80, line.pop("y"), line.pop("text"), line.pop("size", 44), line.pop("fill", NAVY), **line)

    p.text(80, 1130, "Ranks as declared in the official results. Students shown gave written consent.", 24,
           spec.get("disclaimer_fill", INK))
    p.draw.rectangle((0, 1190, W, H), fill=NAVY)
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
     "expect": ["CCPA-01"], "plants": "the banned claim “100% selection guaranteed”"},
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
     "expect": ["AI-01"], "plants": "Hindi text with the disguised guarantee “सीट तय है!” (your seat is fixed)"},
    {"name": "11-old-consent", "title": "Karan's result", "channel": "print", "tags": ["Karan Thapa"],
     "toppers": [dict(name="Karan Thapa", rank=340, course="1-Year Crash Course", duration="1 year", paid="Paid")],
     "expect": ["CCPA-03"], "plants": "Karan Thapa, whose consent is dated before the result"},
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
            "expect": spec["expect"], "plants": spec["plants"], "sha256": sha,
        })
        print(f"{png.name}: expects {spec['expect'] or 'all pass'}")
    (READINGS_DIR / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    (POSTERS_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
                                               encoding="utf-8")


if __name__ == "__main__":
    main()
