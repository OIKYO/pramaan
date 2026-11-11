from collections.abc import Callable

import cv2
import numpy as np
from PIL import Image

from app.models import Finding, PosterReading
from pipeline.boxes import to_pixels
from rules.registry import Problem, rule_def, to_finding
from rules.text import digits, evidence

KEY_KINDS = ("rank", "fee", "phone", "stat")
# Readers' boxes are often a little off, and Tesseract misreads digits that touch the edge of the crop,
# so the crop grows by part of the box's height and width and gets a white margin. Tuned on the 50 test
# posters: every number on the exact boxes, and 60 of 62 on the live reader's boxes (docs/decisions.md).
PAD_Y = 0.6
PAD_X = 0.3
SCALE = 3
BORDER = 12
TESSERACT_CONFIG = "--psm 7 -c tessedit_char_whitelist=0123456789"
# Tesseract reads letters and symbols next to a number (the "AIR" in "AIR 73", the "₹") as stray
# digits, because it may only answer in digits. Up to this many extra leading digits are tolerated.
MAX_EXTRA_LEADING_DIGITS = 3

DigitReader = Callable[[Image.Image, list[int]], str]


def tesseract_available(cmd: str = "") -> bool:
    import pytesseract

    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def prepare_crop(image: Image.Image, box_2d: list[int]) -> np.ndarray:
    left, top, right, bottom = to_pixels(box_2d, image.width, image.height)
    height, width = bottom - top, right - left
    side = width * PAD_X + height * 0.2
    left, right = max(0, int(left - side)), min(image.width, int(right + side))
    top, bottom = max(0, int(top - height * PAD_Y)), min(image.height, int(bottom + height * PAD_Y))
    crop = np.array(image.convert("RGB").crop((left, top, max(right, left + 1), max(bottom, top + 1))))
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    gray = cv2.resize(gray, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if np.mean(binary) < 127:  # light text on a dark background: invert
        binary = 255 - binary
    return cv2.copyMakeBorder(binary, BORDER, BORDER, BORDER, BORDER, cv2.BORDER_CONSTANT, value=255)


def tesseract_digits(image: Image.Image, box_2d: list[int]) -> str:
    import pytesseract

    text = pytesseract.image_to_string(prepare_crop(image, box_2d), config=TESSERACT_CONFIG)
    return digits(text)


def digits_agree(gemini_raw: str, second_read: str, kind: str) -> bool:
    expected = digits(gemini_raw)
    if not expected or not second_read:
        return False
    if kind == "phone":
        return second_read[-10:] == expected[-10:]
    return second_read.endswith(expected) and len(second_read) - len(expected) <= MAX_EXTRA_LEADING_DIGITS


def cross_check(image: Image.Image, reading: PosterReading, read_digits: DigitReader | None) -> list[Finding]:
    """READ-02 findings. `read_digits` is None when Tesseract isn't installed on this server."""
    numbers = [n for n in reading.numbers if n.kind in KEY_KINDS]
    if not numbers:
        return [_passed("No ranks, fees, phone numbers or figures to double-check.")]
    if read_digits is None:
        return [to_finding("READ-02", Problem(
            "The second read of key numbers didn't run: Tesseract isn't available on this server.",
            {}, "Check every rank, fee, phone number and figure on the poster by eye.",
        ))]
    findings = []
    for number in numbers:
        second = read_digits(image, number.box_2d)
        where = evidence(number.box_2d, number.raw_text, second_read=second, kind=number.kind)
        if not second:
            findings.append(to_finding("READ-02", Problem(
                f"The second reader couldn't read “{number.raw_text}”.", where,
                "Look at the number on the poster and confirm it.",
            )))
        elif not digits_agree(number.raw_text, second, number.kind):
            findings.append(to_finding("READ-02", Problem(
                f"The AI read “{number.raw_text}”, but the second reader saw “{second}”.", where,
                "Look at the number on the poster and confirm which reading is right.",
            )))
    return findings or [_passed(f"All {len(numbers)} key numbers read the same twice.")]


def _passed(message: str) -> Finding:
    return Finding(rule_id="READ-02", kind="reader", severity="pass", message=message,
                   reason=rule_def("READ-02").reason)
