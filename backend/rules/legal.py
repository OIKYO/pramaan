"""Legal and regulatory compliance (LEGAL-01, LEGAL-02): the disclaimers head office requires on every
poster, and claims the organisation's industry may never make (listed per industry in
app/catalog.json)."""

from rapidfuzz import fuzz

from rules.registry import Problem, RuleContext, rule
from rules.text import evidence, norm

DISCLAIMER_MATCH = 90  # small reading slips are fine; a different sentence isn't


def _everything(ctx: RuleContext) -> str:
    parts = [f"{b.text} {b.romanised}" for b in ctx.reading.text_blocks]
    return norm(" ".join([*parts, ctx.caption]))


@rule("LEGAL-01")
def required_disclaimers(ctx: RuleContext) -> list[Problem]:
    text = _everything(ctx)
    return [
        Problem(f"The disclaimer “{d.strip()}” isn't on the poster.", evidence(None, d.strip()),
                f"Add “{d.strip()}”, word for word, where readers can see it.")
        for d in ctx.brand_kit.required_disclaimers
        if d.strip() and fuzz.partial_ratio(norm(d), text) < DISCLAIMER_MATCH
    ]


@rule("LEGAL-02")
def industry_restricted_claims(ctx: RuleContext) -> list[Problem]:
    phrases = [norm(p) for p in ctx.restricted if p.strip()]
    if not phrases:
        return []
    places = [(f"{b.text} || {b.romanised}", b.text, b.box_2d) for b in ctx.reading.text_blocks]
    places += [(c.text, c.text, c.box_2d) for c in ctx.reading.claims]
    if ctx.caption:
        places.append((ctx.caption, ctx.caption, None))
    who = f"{ctx.industry} ads" if ctx.industry else "Ads in your industry"
    problems, seen = [], set()
    for haystack, text, box in places:
        hits = [p for p in phrases if p in norm(haystack)]
        if hits and norm(text) not in seen:
            seen.add(norm(text))
            problems.append(Problem(f"“{text.strip()}”: {who} may not claim “{hits[0]}”.",
                                    evidence(box, text, phrases=hits), "Remove the claim."))
    return problems
