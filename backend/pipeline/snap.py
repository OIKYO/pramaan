"""Boxes from a reader that places them only roughly (Groq's) are moved onto the text Tesseract finds
on the page, so findings sit on the words they're about and the second read crops the right place.

A line the reader saw moves onto the Tesseract line with the same text nearby; a number moves onto its
own words inside that line. Anything else (people, lines in scripts Tesseract wasn't given) moves by
the correction fitted to the lines that matched.
"""

import numpy as np
from PIL import Image
from rapidfuzz import fuzz

from app.models import PosterReading
from pipeline.boxes import from_pixels
from rules.text import digits, norm

MIN_MATCH = 75   # how alike (0-100) a reader's line and a Tesseract line must be
MAX_SHIFT = 150  # how far up or down (of 1000) a line may move
MIN_LINES = 3    # lines needed before a correction is fitted


def tesseract_lines(image: Image.Image) -> list[tuple[str, list[int], list[tuple[str, list[int]]]]]:
    """(text, box_2d, words) for every line Tesseract finds, each word with its own box_2d."""
    import pytesseract

    data = pytesseract.image_to_data(image, config="--psm 3", output_type=pytesseract.Output.DICT)
    lines: dict[tuple, list[tuple[str, tuple[int, int, int, int]]]] = {}
    for i, word in enumerate(data["text"]):
        if word.strip() and float(data["conf"][i]) > 0:
            key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
            left, top = data["left"][i], data["top"][i]
            lines.setdefault(key, []).append((word, (left, top, left + data["width"][i], top + data["height"][i])))
    out = []
    for words in lines.values():
        boxes = [b for _, b in words]
        box = from_pixels(min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes),
                          image.width, image.height)
        out.append((" ".join(w for w, _ in words), box,
                    [(w, from_pixels(*b, image.width, image.height)) for w, b in words]))
    return out


def _centre_y(box: list[int]) -> float:
    return (box[0] + box[2]) / 2


def _best_line(text: str, box: list[int], lines):
    wanted = norm(text)
    best, best_score = None, 0.0
    for line in lines:
        if abs(_centre_y(line[1]) - _centre_y(box)) > MAX_SHIFT:
            continue
        score = fuzz.ratio(wanted, norm(line[0]))
        if score > best_score:
            best, best_score = line, score
    return best if best_score >= MIN_MATCH else None


def _fit(pairs: list[tuple[float, float]]) -> tuple[float, float]:
    """new = a * old + b, by least squares; no change when there's too little to go on."""
    if len(pairs) < 2 * MIN_LINES:
        return 1.0, 0.0
    old, new = np.array(pairs).T
    a, b = np.polyfit(old, new, 1)
    return (float(a), float(b)) if 0.5 < a < 2.0 else (1.0, 0.0)


def _move(box: list[int], fx: tuple[float, float], fy: tuple[float, float]) -> list[int]:
    (ax, bx), (ay, by) = fx, fy
    return [round(ay * box[0] + by), round(ax * box[1] + bx), round(ay * box[2] + by), round(ax * box[3] + bx)]


def _number_words(raw: str, words) -> list[int] | None:
    wanted = digits(raw)
    if not wanted:
        return None
    for start in range(len(words)):
        if not digits(words[start][0]):
            continue
        joined = ""
        for end in range(start, len(words)):
            joined += digits(words[end][0])
            if joined == wanted or (len(wanted) >= 10 and joined.endswith(wanted[-10:])):
                boxes = [b for _, b in words[start:end + 1]]
                return [min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)]
            if len(joined) > len(wanted) + 3:
                break
    return None


def snap_to_text(image: Image.Image, reading: PosterReading, lines=None) -> PosterReading:
    lines = tesseract_lines(image) if lines is None else lines
    if not lines:
        return reading
    matched: dict[int, tuple] = {}
    xs, ys = [], []
    for i, block in enumerate(reading.text_blocks):
        line = _best_line(block.text, block.box_2d, lines)
        if line:
            matched[i] = line
            xs += [(block.box_2d[1], line[1][1]), (block.box_2d[3], line[1][3])]
            ys += [(block.box_2d[0], line[1][0]), (block.box_2d[2], line[1][2])]
    if len(matched) < MIN_LINES:
        return reading
    fx, fy = _fit(xs), _fit(ys)
    data = reading.model_dump()
    for i, block in enumerate(data["text_blocks"]):
        block["box_2d"] = list(matched[i][1]) if i in matched else _move(block["box_2d"], fx, fy)
    by_text = {norm(reading.text_blocks[i].text): matched[i][1] for i in matched}
    for kind in ("claims", "wording_flags"):
        for item in data[kind]:
            if item["box_2d"] == [0, 0, 0, 0]:
                continue  # wording in the caption has no place on the poster
            item["box_2d"] = list(by_text.get(norm(item["text"]), _move(item["box_2d"], fx, fy)))
    for number in data["numbers"]:
        old = number["box_2d"]
        home = next((matched[i] for i, b in enumerate(reading.text_blocks) if i in matched
                     and b.box_2d[0] <= _centre_y(old) <= b.box_2d[2] and digits(number["raw_text"]) in digits(b.text)), None)
        exact = _number_words(number["raw_text"], home[2]) if home else None
        number["box_2d"] = exact or _move(old, fx, fy)
    for kind in ("people", "other_brands"):
        for item in data[kind]:
            item["box_2d"] = _move(item["box_2d"], fx, fy)
    return PosterReading.model_validate(data)
