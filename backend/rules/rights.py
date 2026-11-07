"""Copyright and asset permissions (RIGHTS-01, RIGHTS-02): no stock-photo watermarks, and other
organisations' names and logos only when head office has approved them as partners."""

from rapidfuzz import fuzz

from rules.registry import Problem, RuleContext, rule
from rules.text import evidence, norm

WATERMARKS = [
    "shutterstock", "getty images", "gettyimages", "istockphoto", "istock", "adobe stock", "freepik", "dreamstime",
    "123rf", "depositphotos", "alamy", "vecteezy", "envato", "stock photo", "watermark",
]
PARTNER_MATCH = 85


@rule("RIGHTS-01")
def no_watermarks(ctx: RuleContext) -> list[Problem]:
    problems = []
    for block in ctx.reading.text_blocks:
        text = norm(block.text)
        hits = [w for w in WATERMARKS if w in text]
        if hits:
            problems.append(Problem(
                f"“{block.text.strip()}” is printed on the poster: a stock library's watermark means the image wasn't licensed.",
                evidence(block.box_2d, block.text, watermark=hits[0]),
                "Replace the image with the licensed copy, which has no watermark.",
            ))
    return problems


@rule("RIGHTS-02")
def approved_partners(ctx: RuleContext) -> list[Problem]:
    approved = [norm(a) for a in [*ctx.brand_kit.approved_partners, ctx.brand_kit.registered_name] if a.strip()]
    problems = []
    for seen in ctx.reading.other_brands:
        name = norm(seen.name)
        if not name or any(fuzz.token_set_ratio(name, a) >= PARTNER_MATCH for a in approved):
            continue
        problems.append(Problem(
            f"The poster shows {seen.name}, which isn't on your approved partners list.",
            evidence(seen.box_2d, seen.name),
            f"Remove {seen.name}, or ask head office to add it to approved partners once you have their permission.",
        ))
    return problems
