from rules.registry import Problem, RuleContext, rule
from rules.text import evidence

MIN_CONTRAST = 4.5        # WCAG AA for normal text
MIN_CONTRAST_LARGE = 3.0  # WCAG AA for large text: 24 px, or 18.66 px bold
# A 1080 x 1350 post is shown about 400 px wide on a phone, so large text is a line at least 3.5% of the
# poster's height (boxes hug the letters, which are a little shorter than the font size).
LARGE_TEXT_SHARE = 0.035
MIN_ALT_TEXT_LENGTH = 20  # shorter than a short sentence doesn't describe a poster
SOCIAL_CHANNELS = ("instagram", "whatsapp")


@rule("ACC-01")
def text_contrast(ctx: RuleContext) -> list[Problem]:
    if ctx.visual is None:
        return [Problem("Couldn't check text contrast: the image analysis didn't run.", {},
                        "Run the checks again. If it keeps failing, a reviewer should check by eye.")]
    problems = []
    for reading in ctx.visual.contrast:
        block = ctx.reading.text_blocks[reading.block_index]
        large = (block.box_2d[2] - block.box_2d[0]) / 1000 >= LARGE_TEXT_SHARE
        needed = MIN_CONTRAST_LARGE if large else MIN_CONTRAST
        if reading.ratio >= needed:
            continue
        problems.append(Problem(
            f"“{block.text}” has a contrast of about {reading.ratio:.1f}:1; {'large ' if large else ''}text needs at least {needed:g}:1.",
            evidence(block.box_2d, block.text, fg=reading.fg, bg=reading.bg, ratio=reading.ratio),
            "Make the text darker or the background lighter (or the other way round).",
        ))
    return problems


@rule("ACC-02")
def alt_text_on_social(ctx: RuleContext) -> list[Problem]:
    if ctx.channel not in SOCIAL_CHANNELS:
        return []  # print posters don't need alt text
    alt = ctx.alt_text.strip()
    if not alt:
        return [Problem(f"This {ctx.channel} post has no alt text.", {},
                        "Describe the poster in a sentence or two: who is shown, the main message and the contact details.")]
    if len(alt) < MIN_ALT_TEXT_LENGTH:
        return [Problem(f"The alt text (“{alt}”) is too short to describe the poster.", {},
                        "Describe who is shown, the main message and the contact details.")]
    return []
