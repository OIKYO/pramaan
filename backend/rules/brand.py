from rapidfuzz import fuzz

from rules.registry import Problem, RuleContext, rule
from rules.text import digits, evidence, norm, phone_key

LOGO_MIN_SCORE = 0.7     # cv2.matchTemplate score that counts as "logo present"
PALETTE_MIN_SHARE = 0.10  # colour clusters smaller than this are ignored
PALETTE_MAX_DELTA_E = 20  # further than this from every brand colour is off-palette


def _not_checked(what: str) -> list[Problem]:
    return [Problem(f"Couldn't check the {what}: the image analysis didn't run.", {},
                    "Run the checks again. If it keeps failing, a reviewer should check by eye.")]


@rule("BRAND-01")
def logo_present(ctx: RuleContext) -> list[Problem]:
    if ctx.visual is None:
        return _not_checked("logo")
    if ctx.visual.logo_score is None or ctx.visual.logo_score < LOGO_MIN_SCORE:
        return [Problem(
            f"The {ctx.brand_kit.registered_name} logo from the brand kit wasn't found on the poster.",
            evidence(None, None, logo_score=ctx.visual.logo_score),
            "Place the logo from the brand kit, unaltered and at a readable size.",
        )]
    return []


@rule("BRAND-02")
def colours_within_palette(ctx: RuleContext) -> list[Problem]:
    if ctx.visual is None:
        return _not_checked("colours")
    palette = ", ".join(ctx.brand_kit.palette)
    return [
        Problem(
            f"{c.hex} covers about {round(c.share * 100)}% of the poster and isn't a brand colour.",
            evidence(None, None, colour=c.hex, share=c.share, delta_e=round(c.delta_e, 1)),
            f"Use the brand colours: {palette}.",
        )
        for c in ctx.visual.palette
        if c.share >= PALETTE_MIN_SHARE and c.delta_e > PALETTE_MAX_DELTA_E
    ]


@rule("BRAND-03")
def registered_name_and_helpline(ctx: RuleContext) -> list[Problem]:
    kit, reading = ctx.brand_kit, ctx.reading
    all_text = " ".join(f"{b.text} {b.romanised}" for b in reading.text_blocks)
    name_seen = reading.registered_name_seen or fuzz.partial_ratio(norm(kit.registered_name), norm(all_text)) >= 90
    helpline = phone_key(kit.helpline)
    helpline_seen = (
        reading.helpline_seen
        or any(n.kind == "phone" and phone_key(n.raw_text) == helpline for n in reading.numbers)
        or helpline in digits(all_text)
    )
    problems = []
    if not name_seen:
        problems.append(Problem(f"The registered name “{kit.registered_name}” isn't on the poster.", {},
                                f"Add “{kit.registered_name}” in the footer."))
    if not helpline_seen:
        problems.append(Problem(f"The helpline {kit.helpline} isn't on the poster.", {},
                                f"Add the helpline {kit.helpline} in the footer."))
    return problems


@rule("BRAND-04")
def tone_of_voice(ctx: RuleContext) -> list[Problem]:
    return [
        Problem(
            f"“{flag.text}”: {flag.why}",
            evidence(flag.box_2d, flag.text, source="ai"),
            f"AI suggestion: {flag.suggested_rewrite}" if flag.suggested_rewrite else None,
        )
        for flag in ctx.reading.wording_flags
        if flag.rule_id == "BRAND-04"
    ]
