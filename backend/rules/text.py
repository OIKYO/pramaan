import re

from rapidfuzz import fuzz

from app.models import Course, PosterReading, TextBlock

# Devanagari and Bengali digits read as ASCII, so "১০০%" and "100%" compare equal.
_DIGITS = str.maketrans("०१२३४५६७८९০১২৩৪৫৬৭৮৯", "01234567890123456789")
_QUOTES = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-"})


def norm(text: str) -> str:
    """Lowercase, ASCII digits, straight quotes, single spaces, "100 %" -> "100%"."""
    text = text.translate(_DIGITS).translate(_QUOTES).lower()
    text = re.sub(r"(\d)\s+%", r"\1%", text)
    return re.sub(r"\s+", " ", text).strip()


def digits(text: str) -> str:
    return re.sub(r"\D", "", text.translate(_DIGITS))


def phone_key(text: str) -> str:
    """Last 10 digits, so '+91 10000 22102', '091000 22102' and '10000 22102' compare equal."""
    d = digits(text)
    return d[-10:] if len(d) >= 10 else d


def number_value(raw: str, value: float | None) -> float | None:
    """The reader's value, or the first number in the raw text ('₹48,000' -> 48000)."""
    if value is not None:
        return value
    match = re.search(r"\d[\d,]*(?:\.\d+)?", raw.translate(_DIGITS))
    return float(match.group().replace(",", "")) if match else None


def inr(amount: float) -> str:
    """₹ with Indian digit grouping: 48000 -> '₹48,000', 120000 -> '₹1,20,000'."""
    s = str(int(round(amount)))
    if len(s) <= 3:
        return f"₹{s}"
    head, tail = s[:-3], s[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    return "₹" + ",".join([head, *groups, tail] if head else [*groups, tail])


_NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "six": 6, "twelve": 12, "eighteen": 18}
_DURATION = re.compile(
    r"\b(\d+|one|two|three|four|six|twelve|eighteen)\s*-?\s*(years?|yrs?|months?|mos?)\b", re.IGNORECASE
)


def duration_months(text: str) -> int | None:
    """'2 years' -> 24, '1-Year' -> 12, 'six months' -> 6. None if there's no duration."""
    match = _DURATION.search(text.translate(_DIGITS))
    if not match:
        return None
    count = match.group(1).lower()
    n = int(count) if count.isdigit() else _NUMBER_WORDS[count]
    return n * 12 if match.group(2).lower().startswith("y") else n


def course_score(course: Course, text: str) -> float:
    """How well a piece of text names this course, 0-100."""
    t = norm(text)
    best = 0.0
    for name in [course.name, *course.aliases]:
        n = norm(name)
        if len(n) <= 5:  # short aliases like "AITS": whole word only
            score = 100.0 if re.search(rf"\b{re.escape(n)}\b", t) else 0.0
        else:
            score = fuzz.partial_ratio(n, t)
        best = max(best, score)
    return best


def best_course(text: str, courses: list[Course]) -> tuple[Course | None, float]:
    scored = [(course_score(c, text), c) for c in courses]
    if not scored:
        return None, 0.0
    score, course = max(scored, key=lambda pair: pair[0])
    return course, score


def block_with(reading: PosterReading, raw: str) -> TextBlock | None:
    wanted, wanted_digits = norm(raw), digits(raw)
    for block in reading.text_blocks:
        if wanted and wanted in norm(block.text):
            return block
    if wanted_digits:
        for block in reading.text_blocks:
            if wanted_digits in digits(block.text):
                return block
    return None


def evidence(box_2d: list[int] | None, text: str | None = None, **extra) -> dict:
    found = {"box_2d": box_2d} if box_2d else {}
    if text:
        found["text"] = text
    return {**found, **extra}
