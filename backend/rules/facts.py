"""Approved facts: course names and durations, fees, branch contact details, expiry (FACT-01 to FACT-04)."""

import re

from rapidfuzz import fuzz

from rules.registry import Problem, RuleContext, rule
from rules.text import best_course, block_with, duration_months, evidence, inr, norm, number_value, phone_key

COURSE_MENTION = 90   # a text block names this course
COURSE_UNKNOWN = 75   # below this, a block that looks like a course name matches nothing approved
COURSE_WORDS = re.compile(r"\b(course|programme|program|batch|series)\b", re.IGNORECASE)
PIN_CODE = re.compile(r"\b\d{6}\b")


@rule("FACT-01")
def courses_and_durations(ctx: RuleContext) -> list[Problem]:
    problems = []
    for block in ctx.reading.text_blocks:
        course, score = best_course(block.text, ctx.courses)
        shown = duration_months(block.text)
        if course and score >= COURSE_MENTION:
            if shown is not None and shown != course.duration_months:
                problems.append(Problem(
                    f"“{block.text}” gives a duration of {shown} months, but {course.name} is {course.duration_label}.",
                    evidence(block.box_2d, block.text),
                    f"Write the course as “{course.name}” ({course.duration_label}).",
                ))
        elif COURSE_WORDS.search(block.text) and shown is not None and score < COURSE_UNKNOWN:
            problems.append(Problem(
                f"“{block.text}” names a course that isn't on the approved list.",
                evidence(block.box_2d, block.text),
                "Use an approved course: " + ", ".join(f"{c.name} ({c.duration_label})" for c in ctx.courses) + ".",
            ))
    return problems


@rule("FACT-02")
def fees(ctx: RuleContext) -> list[Problem]:
    approved = {c.fee_inr: c for c in ctx.courses if c.is_paid and c.fee_inr}
    problems = []
    for number in ctx.reading.numbers:
        if number.kind != "fee":
            continue
        value = number_value(number.raw_text, number.value)
        if value is None:
            continue  # unreadable numbers go to a person (READ-02)
        block = block_with(ctx.reading, number.raw_text)
        course, score = best_course(block.text, ctx.courses) if block else (None, 0.0)
        where = evidence(number.box_2d, block.text if block else number.raw_text)
        if course and score >= COURSE_MENTION:
            if not course.is_paid and value > 0:
                problems.append(Problem(f"Shows a fee of {inr(value)} for {course.name}, which is free.", where,
                                        f"Remove the fee; {course.name} is free."))
            elif course.is_paid and value != course.fee_inr:
                problems.append(Problem(f"Shows {inr(value)} for {course.name}; the approved fee is {inr(course.fee_inr)}.",
                                        where, f"Change the fee to {inr(course.fee_inr)}."))
        elif value not in approved:
            listed = ", ".join(f"{inr(fee)} ({c.name})" for fee, c in approved.items())
            problems.append(Problem(f"{inr(value)} isn't an approved fee.", where, f"Use an approved fee: {listed}."))
    return problems


@rule("FACT-03")
def contact_details(ctx: RuleContext) -> list[Problem]:
    branch, helpline = ctx.branch, ctx.brand_kit.helpline
    allowed = {phone_key(branch.phone), phone_key(helpline)}
    fix = f"Use the {branch.city} branch number {branch.phone} or the helpline {helpline}."
    problems = [
        Problem(f"{n.raw_text} isn't the {branch.city} branch number or the helpline.",
                evidence(n.box_2d, n.raw_text), fix)
        for n in ctx.reading.numbers
        if n.kind == "phone" and phone_key(n.raw_text) not in allowed
    ]
    for block in ctx.reading.text_blocks:
        has_pin_code = PIN_CODE.search(block.text) is not None  # an address has a 6-digit PIN code
        if has_pin_code and fuzz.token_set_ratio(norm(block.text), norm(branch.address)) < 85:
            problems.append(Problem(
                f"The address “{block.text}” doesn't match the {branch.city} branch.",
                evidence(block.box_2d, block.text),
                f"Use the branch address: {branch.address}.",
            ))
    return problems


@rule("FACT-04")
def no_expired_facts(ctx: RuleContext) -> list[Problem]:
    used: dict[str, tuple[str, object, list[int] | None]] = {}  # id -> (name, valid_until, box)
    for block in ctx.reading.text_blocks:
        course, score = best_course(block.text, ctx.courses)
        if course and score >= COURSE_MENTION:
            used.setdefault(course.id, (course.name, course.valid_until, block.box_2d))
    for person, topper in ctx.matched():
        if course := ctx.course(topper.course_id):
            used.setdefault(course.id, (course.name, course.valid_until, person.box_2d))
    for number in ctx.reading.numbers:
        value = number_value(number.raw_text, number.value)
        for stat in ctx.result_stats:
            if number.kind == "stat" and value is not None and abs(value - stat.value) < 1e-9:
                used.setdefault(stat.id, (f"the figure “{stat.label}”", stat.valid_until, number.box_2d))

    return [
        Problem(f"{name[0].upper()}{name[1:]} was approved until {valid_until:%d %b %Y} and has expired.",
                evidence(box, name), "Ask head office to re-approve it, or remove it from the poster.")
        for name, valid_until, box in used.values()
        if valid_until is not None and valid_until < ctx.today
    ]
