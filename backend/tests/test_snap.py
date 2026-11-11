import pytest

from app.config import get_settings
from app.models import PosterReading
from pipeline import ocr
from pipeline.run import load_image
from pipeline.snap import snap_to_text
from tests.test_pipeline import POSTERS

HAS_TESSERACT = ocr.tesseract_available(get_settings().tesseract_cmd)


def squeezed(box: list[int]) -> list[int]:
    """Like Groq: y close, x at about 0.8 of where it is."""
    return [box[0] + 8, round(box[1] * 0.8), box[2] + 8, round(box[3] * 0.8)]


def reading_with(lines: list[tuple[str, list[int]]], numbers=()) -> PosterReading:
    return PosterReading.model_validate({
        "text_blocks": [{"text": t, "box_2d": squeezed(b)} for t, b in lines],
        "numbers": [{"kind": k, "raw_text": r, "value": None, "box_2d": squeezed(b)} for k, r, b in numbers],
    })


LINES = [
    ("Northfield Academy", [47, 222, 89, 715]),
    ("Our JEE Main 2026 toppers", [196, 74, 238, 754]),
    ("42 classroom students qualified JEE Main 2026", [439, 74, 470, 900]),
    ("2-Year Classroom Programme: ₹48,000", [490, 74, 512, 609]),
    ("Siliguri branch: +91 10000 22102", [536, 74, 553, 524]),
]


def test_lines_and_numbers_move_onto_the_text_found():
    words = {"₹48,000": [490, 503, 512, 609], "+91": [536, 286, 553, 330], "10000": [536, 340, 553, 420], "22102": [536, 430, 553, 524]}
    found = [(text, box, [(w, words.get(w, box)) for w in text.split()]) for text, box in LINES]
    reading = reading_with(LINES, [("fee", "₹48,000", [490, 503, 512, 609]), ("phone", "+91 10000 22102", [536, 286, 553, 524])])
    snapped = snap_to_text(None, reading, lines=found)
    assert [b.box_2d for b in snapped.text_blocks] == [box for _, box in LINES]
    assert snapped.numbers[0].box_2d == words["₹48,000"]
    assert snapped.numbers[1].box_2d == [536, 286, 553, 524]


def test_too_few_matching_lines_change_nothing():
    reading = reading_with(LINES[:2])
    assert snap_to_text(None, reading, lines=[("something else", [0, 0, 10, 10], [])]) == reading


@pytest.mark.skipif(not HAS_TESSERACT, reason="needs Tesseract")
def test_squeezed_boxes_snap_back_on_a_real_poster():
    truth = PosterReading.model_validate_json((POSTERS.parent / "backend/tests/fixtures/readings/03-wrong-rank.json").read_text(encoding="utf-8"))
    data = truth.model_dump()
    for kind in ("text_blocks", "numbers", "people"):
        for item in data[kind]:
            item["box_2d"] = squeezed(item["box_2d"])
    snapped = snap_to_text(load_image((POSTERS / "03-wrong-rank.png").read_bytes()), PosterReading.model_validate(data))
    for got, want in zip(snapped.numbers, truth.numbers):
        assert max(abs(a - b) for a, b in zip(got.box_2d, want.box_2d)) <= 15, (got.raw_text, got.box_2d, want.box_2d)
