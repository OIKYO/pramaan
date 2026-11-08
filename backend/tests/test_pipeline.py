import json
from dataclasses import replace

import pytest
from PIL import Image

from app.config import BACKEND_DIR, REPO_DIR, get_settings
from app.models import PosterReading
from pipeline import ocr, reader
from pipeline.boxes import from_pixels, to_pixels
from pipeline.run import PosterInput, Reference, check_poster
from rules.text import digits
from tests.builders import BRAND_KIT, BRANCH, COURSES, NORTHFIELD_WORDS, STATS, TODAY, TOPPERS, topper_id

POSTERS = REPO_DIR / "test-posters"
MANIFEST = json.loads((POSTERS / "manifest.json").read_text(encoding="utf-8"))
SETTINGS = replace(get_settings(), reader_mode="fixture", gemini_api_key="", groq_api_key="")
REFERENCE = Reference(
    brand_kit=BRAND_KIT, courses=COURSES, result_stats=STATS, toppers=TOPPERS, branch=BRANCH,
    logo=Image.open(BACKEND_DIR / "assets" / "northfield-logo.png").convert("RGB"), words=NORTHFIELD_WORDS,
)


def perfect_second_reader(reading: PosterReading):
    """Stands in for Tesseract: returns the digits Gemini reported for the box it is given."""
    by_box = {tuple(n.box_2d): digits(n.raw_text) for n in reading.numbers}
    return lambda image, box_2d: by_box[tuple(box_2d)]


def run_poster(entry: dict, **changes):
    data = (POSTERS / entry["file"]).read_bytes()
    poster = PosterInput(
        image=data, mime_type="image/png", channel=entry["channel"], caption=entry["caption"],
        alt_text=entry["alt_text"], tagged_topper_ids=[topper_id(n) for n in entry["tags"]], filename=entry["file"],
    )
    for key, value in changes.items():
        setattr(poster, key, value)
    fixture = reader.read_fixture(entry["name"]).reading
    return check_poster(poster, REFERENCE, SETTINGS, digit_reader=perfect_second_reader(fixture), today=TODAY)


@pytest.mark.parametrize("entry", MANIFEST, ids=[e["name"] for e in MANIFEST])
def test_each_poster_fails_exactly_its_planted_checks(entry):
    result = run_poster(entry)
    failed = {f.rule_id for f in result.findings if f.severity != "pass"}
    assert failed == set(entry["expect"]), [f.message for f in result.findings if f.severity != "pass"]
    assert result.reader_model == f"fixture:{entry['name']}"
    assert result.ai_call is None  # fixture mode never calls an AI
    assert {f.rule_id for f in result.findings} >= {"READ-01", "READ-02", "READ-03"}
    assert len({f.rule_id for f in result.findings}) == 30


def test_fixtures_are_found_by_image_hash_not_file_name():
    entry = MANIFEST[0]
    result = run_poster(entry, filename="renamed-by-staff.png")
    assert result.reader_model == "fixture:01-clean"


def test_a_poster_that_cant_be_read_gets_one_finding_for_a_person():
    image = Image.new("RGB", (400, 400), "white")
    from io import BytesIO
    buf = BytesIO()
    image.save(buf, format="PNG")
    result = check_poster(PosterInput(image=buf.getvalue(), mime_type="image/png", channel="print", filename="unknown.png"),
                          REFERENCE, SETTINGS, digit_reader=None, today=TODAY)
    assert [(f.rule_id, f.severity) for f in result.findings] == [("READ-01", "needs_human")]
    assert result.reading is None


def test_untagged_person_goes_to_a_person():
    result = run_poster(MANIFEST[0], tagged_topper_ids=[topper_id("Riya Sen")])  # Ananya not tagged
    flagged = [f for f in result.findings if f.rule_id == "READ-03" and f.severity == "needs_human"]
    assert flagged and "Ananya Roy" in flagged[0].message


def test_without_tesseract_the_second_read_is_flagged_not_skipped():
    entry = MANIFEST[0]
    data = (POSTERS / entry["file"]).read_bytes()
    poster = PosterInput(image=data, mime_type="image/png", channel="print", filename=entry["file"],
                         tagged_topper_ids=[topper_id(n) for n in entry["tags"]])
    result = check_poster(poster, REFERENCE, SETTINGS, digit_reader=None, today=TODAY)
    [read02] = [f for f in result.findings if f.rule_id == "READ-02"]
    assert read02.severity == "needs_human" and "Tesseract" in read02.message


def test_box_conversion_round_trips_and_uses_y_first():
    assert to_pixels([100, 200, 300, 400], width=1000, height=2000) == (200, 200, 400, 600)
    assert from_pixels(200, 200, 400, 600, width=1000, height=2000) == [100, 200, 300, 400]
    # 8% padding grows the box and is clamped to the image.
    assert to_pixels([0, 0, 1000, 1000], 100, 100, pad=0.08) == (0, 0, 100, 100)
    assert to_pixels([400, 400, 500, 500], 1000, 1000, pad=0.1) == (390, 390, 510, 510)


@pytest.mark.parametrize(("raw", "second", "kind", "agree"), [
    ("AIR 73", "73", "rank", True),
    ("AIR 73", "41873", "rank", True),     # "AIR" misread as digits in front
    ("AIR 73", "37", "rank", False),
    ("₹48,000", "248000", "fee", True),    # the ₹ sign misread as a digit
    ("₹48,000", "45000", "fee", False),
    ("+91 10000 22102", "1000022102", "phone", True),
    ("+91 10000 22102", "1000022109", "phone", False),
    ("42", "", "stat", False),
])
def test_second_read_comparison(raw, second, kind, agree):
    assert ocr.digits_agree(raw, second, kind) is agree


def test_disagreeing_or_unreadable_numbers_need_a_person():
    reading = reader.read_fixture("01-clean").reading
    answers = {tuple(n.box_2d): digits(n.raw_text) for n in reading.numbers}
    fee = next(n for n in reading.numbers if n.kind == "fee")
    stat = next(n for n in reading.numbers if n.kind == "stat")
    answers[tuple(fee.box_2d)] = "45000"
    answers[tuple(stat.box_2d)] = ""
    findings = ocr.cross_check(Image.new("RGB", (10, 10)), reading, lambda img, box: answers[tuple(box)])
    messages = [f.message for f in findings if f.severity == "needs_human"]
    assert len(messages) == 2
    assert any("₹48,000" in m and "45000" in m for m in messages)


def test_prepare_crop_gives_dark_text_on_white():
    image = Image.open(POSTERS / "01-clean.png")
    footer_phone = [n for n in reader.read_fixture("01-clean").reading.numbers if n.kind == "phone"][-1]
    crop = ocr.prepare_crop(image, footer_phone.box_2d)  # cream text on navy in the footer
    assert crop.mean() > 127  # inverted to mostly white


def test_invalid_output_is_retried_then_given_up():
    answers = iter(["not json", '{"text_blocks": "wrong"}', json.dumps({"text_blocks": []})])
    errors: list[str] = []
    reading, attempts = reader._try("fake", lambda: next(answers), errors)
    assert reading is not None and attempts == 3 and len(errors) == 2

    errors = []
    reading, attempts = reader._try("fake", lambda: "still not json", errors)
    assert reading is None and attempts == reader.MAX_ATTEMPTS


def test_a_failing_service_is_not_retried():
    def broken():
        raise TimeoutError("quota")

    errors: list[str] = []
    assert reader._try("fake", broken, errors) == (None, 1)


def test_a_temporary_outage_is_retried_once():
    calls = iter([RuntimeError("503 UNAVAILABLE"), RuntimeError("503 UNAVAILABLE")])

    def busy():
        raise next(calls)

    waits: list[float] = []
    assert reader._try("fake", busy, [], wait=waits.append) == (None, 2)
    assert waits == [reader.SERVICE_RETRY_SECONDS]

    answers = iter([RuntimeError("503 UNAVAILABLE"), json.dumps({"text_blocks": []})])

    def recovers():
        answer = next(answers)
        if isinstance(answer, Exception):
            raise answer
        return answer

    reading, attempts = reader._try("fake", recovers, [], wait=lambda s: None)
    assert reading is not None and attempts == 2


def test_contrast_is_not_measured_where_the_box_holds_no_text():
    import numpy as np

    image = np.array(Image.open(POSTERS / "01-clean.png").convert("RGB"))
    disclaimer = next(b for b in reader.read_fixture("01-clean").reading.text_blocks if b.text.startswith("Ranks"))
    y0, x0, y1, x1 = disclaimer.box_2d
    from pipeline import visual
    assert visual.block_contrast(image, [y0 - 40, x0, y1 - 40, x1]) is None  # box slipped onto plain background
    pale = np.array(Image.open(POSTERS / "09-low-contrast.png").convert("RGB"))
    assert visual.block_contrast(pale, disclaimer.box_2d)[0] < 2  # faint text is still measured


def test_prompt_names_only_the_two_ai_rules_and_includes_the_caption():
    prompt = reader.build_prompt(BRAND_KIT, "Selection pakka!")
    assert "AI-01" in prompt and "BRAND-04" in prompt and "Selection pakka!" in prompt
    assert BRAND_KIT.tone_notes in prompt
