"""Dates, deadlines and availability (EVENT-01 to EVENT-03). They act only when a poster shows a date.

Dates are found in the poster's text and caption, written as "14 March 2027", "Sunday, 14th Mar
2027", "March 14, 2027" or "14/03/2027" (day first, as in India).
"""

import calendar
import re
from dataclasses import dataclass
from datetime import date

from rules.registry import Problem, RuleContext, rule
from rules.text import evidence

MONTHS = {name.lower(): n for n, name in enumerate(calendar.month_name) if name}
DAYS = [name for name in calendar.day_name]  # Monday first, as date.weekday() counts
_MONTH = r"(?P<m>january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b\.?"
_WEEKDAY = r"(?:\b(?P<wd>monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|wed|thurs|thu|fri|sat|sun)\b\.?,?\s+)?"
_ORD = r"(?:st|nd|rd|th)?"
PATTERNS = [
    (re.compile(rf"{_WEEKDAY}\b(?P<d>\d{{1,2}}){_ORD}\s+(?:of\s+)?{_MONTH}(?:,?\s+(?P<y>\d{{4}})\b)?", re.I), False),
    (re.compile(rf"{_WEEKDAY}\b{_MONTH}\s+(?P<d>\d{{1,2}}){_ORD}\b,?\s+(?P<y>\d{{4}})\b", re.I), False),
    (re.compile(rf"{_WEEKDAY}\b(?P<d>\d{{1,2}})[/.-](?P<m>\d{{1,2}})[/.-](?P<y>\d{{4}}|\d{{2}})\b", re.I), True),
]
# Words that make a date something still to come: a deadline, a start, an offer's end.
UPCOMING = re.compile(
    r"\b(last date|deadline|closing date|apply (?:by|before)|register (?:by|before)|closes|ends"
    r"|(?:admissions?|applications?|registrations?|enrol?ments?|entries|bookings?|offer|sale)\s+(?:close|closing|end|ending)"
    r"|valid (?:till|until|up ?to)|till|until|starts|begins|commences|from|admissions? open|before|walk-?in)\b", re.I)


@dataclass
class SeenDate:
    text: str
    day: int
    month: int
    year: int | None
    weekday: int | None
    box: list[int] | None
    block: str

    def real(self) -> date | None:
        """The calendar date, or None if it doesn't exist. Without a year, 29 February counts as real."""
        try:
            return date(self.year or 2028, self.month, self.day)
        except ValueError:
            return None


def _weekday(name: str | None) -> int | None:
    if not name:
        return None
    return next(i for i, day in enumerate(DAYS) if day.lower().startswith(name.lower()[:3]))


def dates_on(ctx: RuleContext) -> list[SeenDate]:
    places = [(b.text, b.box_2d) for b in ctx.reading.text_blocks]
    if ctx.caption:
        places.append((ctx.caption, None))
    found = []
    for text, box in places:
        taken: list[tuple[int, int]] = []
        for pattern, numeric in PATTERNS:
            for m in pattern.finditer(text):
                if any(m.start() < end and start < m.end() for start, end in taken):
                    continue
                day = int(m["d"])
                month = int(m["m"]) if numeric else MONTHS.get(m["m"].lower()) or next(
                    n for name, n in MONTHS.items() if name.startswith(m["m"].lower()[:3]))
                if numeric and not (1 <= month <= 12 and 1 <= day <= 31):
                    continue  # probably not a date at all, e.g. a version number
                year = int(m["y"]) if m["y"] else None
                if year is not None and year < 100:
                    year += 2000
                taken.append(m.span())
                found.append(SeenDate(m.group(0).strip(" ,"), day, month, year, _weekday(m["wd"]), box, text))
    return found


@rule("EVENT-01")
def real_dates(ctx: RuleContext) -> list[Problem]:
    problems = []
    for d in dates_on(ctx):
        if d.real() is None:
            days = calendar.monthrange(d.year or 2028, d.month)[1]
            when = f"{calendar.month_name[d.month]}{f' {d.year}' if d.year else ''}"
            problems.append(Problem(f"“{d.text}” isn't a real date.", evidence(d.box, d.text),
                                    f"Check the date: {when} has {days} days."))
    return problems


@rule("EVENT-02")
def weekday_matches(ctx: RuleContext) -> list[Problem]:
    problems = []
    for d in dates_on(ctx):
        real = d.real()
        if d.weekday is None or d.year is None or real is None or real.weekday() == d.weekday:
            continue
        actual = DAYS[real.weekday()]
        problems.append(Problem(
            f"“{d.text}”: {real.day} {real:%B %Y} is a {actual}, not a {DAYS[d.weekday]}.",
            evidence(d.box, d.text), f"Write “{actual}, {real.day} {real:%B %Y}”, or check which date is meant.",
        ))
    return problems


@rule("EVENT-03")
def no_passed_deadlines(ctx: RuleContext) -> list[Problem]:
    problems = []
    for d in dates_on(ctx):
        real = d.real()
        if d.year is None or real is None or real >= ctx.today or not UPCOMING.search(d.block):
            continue
        problems.append(Problem(
            f"“{d.block.strip()}” gives {real.day} {real:%B %Y}, which has passed.",
            evidence(d.box, d.block), "Change the date to one still to come, or don't publish this poster.",
        ))
    return problems
