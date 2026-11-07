"""Claims and toppers: banned promises, consent, ranks, required details, results figures, and the
AI's disguised-guarantee flags (CCPA-01 to CCPA-06, AI-01)."""

from rapidfuzz import fuzz

from rules.registry import Problem, RuleContext, rule
from rules.text import best_course, block_with, duration_months, evidence, norm, number_value

# Built-in banned phrases (CCPA-01). Head office adds more in brand_kit.banned_phrases.
BANNED_PHRASES = [
    # English
    "100% selection", "guaranteed selection", "selection guaranteed", "guaranteed rank", "100% job",
    "job guaranteed", "guaranteed job", "100% result", "guaranteed success", "assured selection",
    # Hindi: Devanagari and romanised
    "100% चयन", "चयन की गारंटी", "गारंटीड चयन", "नौकरी की गारंटी",
    "100% chayan", "chayan ki guarantee", "naukri ki guarantee",
    # Bengali: Bengali script and romanised
    "১০০% সিলেকশন", "নিশ্চিত সিলেকশন", "চাকরির গ্যারান্টি", "nishchit selection", "chakrir guarantee",
]


def _approved_figure_example(ctx: RuleContext) -> str:
    if ctx.result_stats:
        stat = ctx.result_stats[0]
        return f" You can show a verified result instead, such as “{stat.label}: {stat.value:g}”."
    return ""


@rule("CCPA-01")
def no_banned_claims(ctx: RuleContext) -> list[Problem]:
    phrases = [norm(p) for p in [*BANNED_PHRASES, *ctx.brand_kit.banned_phrases] if p.strip()]
    places = [(b.text, b.romanised, b.box_2d) for b in ctx.reading.text_blocks]
    places += [(c.text, "", c.box_2d) for c in ctx.reading.claims]
    if ctx.caption:
        places.append((ctx.caption, "", None))

    problems, seen = [], set()
    for text, romanised, box in places:
        haystack = f"{norm(text)} || {norm(romanised)}"
        hits = [p for p in phrases if p in haystack]
        if hits and norm(text) not in seen:  # one finding per line, however many phrases it hits
            seen.add(norm(text))
            where = "The caption" if box is None else "The poster"
            problems.append(Problem(
                message=f"{where} says “{text.strip()}”, which promises a result.",
                evidence=evidence(box, text, phrases=hits),
                suggested_fix="Remove the promise." + _approved_figure_example(ctx),
            ))
    return problems


@rule("CCPA-02")
def consent_on_file(ctx: RuleContext) -> list[Problem]:
    problems = []
    for match in ctx.people:
        person = ctx.reading.people[match.person_index]
        if match.status == "no_match":
            problems.append(Problem(
                message=f"{person.name} isn't in the toppers register, so there is no consent on file.",
                evidence=evidence(person.box_2d, person.name),
                suggested_fix=f"Remove {person.name}, or ask head office to add them to the register with signed consent.",
            ))
        elif match.status == "match":
            topper = ctx.toppers[match.topper_id]
            if not topper.consent_path:
                problems.append(Problem(
                    message=f"{topper.full_name} is shown, but there's no signed consent on file.",
                    evidence=evidence(person.box_2d, person.name, topper_id=topper.id),
                    suggested_fix=f"Remove {topper.full_name} from the poster, or upload their signed consent to the toppers register first.",
                ))
    return problems


@rule("CCPA-03")
def consent_is_valid(ctx: RuleContext) -> list[Problem]:
    problems = []
    for person, topper in ctx.matched():
        if not topper.consent_path:
            continue  # CCPA-02 reports missing consent.
        where = evidence(person.box_2d, person.name, topper_id=topper.id)
        name = topper.full_name
        if topper.consent_date is None or topper.consent_date <= topper.result_date:
            when = f"on {topper.consent_date:%d %b %Y}" if topper.consent_date else "with no date"
            problems.append(Problem(
                f"{name}'s consent was signed {when}, before the result on {topper.result_date:%d %b %Y}, so it can't cover this result.",
                where, f"Get fresh written consent from {name}, dated after the result.",
            ))
        if ctx.channel not in topper.consent_channels:
            allowed = ", ".join(topper.consent_channels) or "no channels"
            problems.append(Problem(
                f"{name}'s consent covers {allowed}, not {ctx.channel}.", where,
                f"Use this poster only on {allowed}, or get {name}'s consent for {ctx.channel}.",
            ))
        if topper.consent_valid_until and ctx.today > topper.consent_valid_until:
            problems.append(Problem(
                f"{name}'s consent expired on {topper.consent_valid_until:%d %b %Y}.", where,
                f"Renew {name}'s consent before using their result.",
            ))
        if topper.is_minor and not topper.guardian_signed:
            problems.append(Problem(
                f"{name} is a minor, and the consent isn't signed by a parent or guardian.", where,
                f"Get the consent form countersigned by {name}'s parent or guardian.",
            ))
    return problems


def _inside(inner: list[int], outer: list[int]) -> bool:
    """The centre of `inner` lies within `outer` (both box_2d)."""
    cy, cx = (inner[0] + inner[2]) / 2, (inner[1] + inner[3]) / 2
    return outer[0] <= cy <= outer[2] and outer[1] <= cx <= outer[3]


def _rank_box(ctx: RuleContext, person, shown: float) -> list[int]:
    """Point at the rank itself when the reader boxed it, so the finding marks the exact number."""
    for number in ctx.reading.numbers:
        if (number.kind == "rank" and number_value(number.raw_text, number.value) == shown
                and _inside(number.box_2d, person.box_2d)):
            return number.box_2d
    return person.box_2d


@rule("CCPA-04")
def rank_matches(ctx: RuleContext) -> list[Problem]:
    problems = []
    for person, topper in ctx.matched():
        shown = person.rank_value if person.rank_value is not None else number_value(person.rank_text, None)
        if shown is not None and int(shown) != topper.rank:
            problems.append(Problem(
                f"Shows {person.rank_text or f'AIR {int(shown)}'} for {topper.full_name}; the register says AIR {topper.rank}.",
                evidence(_rank_box(ctx, person, shown), person.rank_text or person.name, topper_id=topper.id),
                f"Change the rank to AIR {topper.rank}.",
            ))
    return problems


@rule("CCPA-05")
def details_next_to_toppers(ctx: RuleContext) -> list[Problem]:
    problems = []
    for person, topper in ctx.matched():
        course = ctx.course(topper.course_id)
        issues = []
        if not person.rank_text and person.rank_value is None:
            issues.append("no rank")
        if not person.course_text:
            issues.append("no course")
        elif course:
            shown_course, score = best_course(person.course_text, ctx.courses)
            if shown_course is None or score < 80 or shown_course.id != course.id:
                issues.append(f"the course shown (“{person.course_text}”) isn't the one they took")
        if not person.duration_text:
            issues.append("no course duration")
        elif course and duration_months(person.duration_text) != course.duration_months:
            issues.append(f"the duration shown (“{person.duration_text}”) is wrong")
        if not person.paid_text:
            issues.append("no paid or free label")
        elif course:
            shown = norm(person.paid_text)
            says_free, says_paid = "free" in shown, "paid" in shown or "₹" in shown
            if (course.is_paid and says_free) or (not course.is_paid and says_paid):
                issues.append(f"it says “{person.paid_text}”, but the course is {'paid' if course.is_paid else 'free'}")
        if issues:
            fix = f"Show next to {topper.full_name}: AIR {topper.rank}"
            if course:
                fix += f" · {course.name} · {course.duration_label} · {'paid' if course.is_paid else 'free'}"
            problems.append(Problem(
                f"Next to {topper.full_name}: {'; '.join(issues)}.",
                evidence(person.box_2d, person.name, topper_id=topper.id),
                fix + ".",
            ))
    return problems


@rule("CCPA-06")
def results_figures(ctx: RuleContext) -> list[Problem]:
    problems = []
    for number in ctx.reading.numbers:
        if number.kind != "stat":
            continue
        value = number_value(number.raw_text, number.value)
        if any(value is not None and abs(value - s.value) < 1e-9 for s in ctx.result_stats):
            continue
        block = block_with(ctx.reading, number.raw_text)
        context = block.text if block else number.raw_text
        nearest = max(ctx.result_stats, key=lambda s: fuzz.token_set_ratio(s.label, context), default=None)
        fix = (f"Use the approved figure: {nearest.label}: {nearest.value:g}." if nearest
               else "Remove the figure, or ask head office to approve it first.")
        problems.append(Problem(
            f"“{context.strip()}” isn't an approved results figure.",
            evidence(number.box_2d, number.raw_text), fix,
        ))
    return problems


@rule("AI-01")
def disguised_guarantees(ctx: RuleContext) -> list[Problem]:
    return [
        Problem(
            f"“{flag.text}”: {flag.why}",
            evidence(flag.box_2d, flag.text, source="ai"),
            f"AI suggestion: {flag.suggested_rewrite}" if flag.suggested_rewrite else None,
        )
        for flag in ctx.reading.wording_flags
        if flag.rule_id == "AI-01"
    ]
