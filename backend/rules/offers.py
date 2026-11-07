"""Offers, discounts and terms (OFFER-01 to OFFER-03). They act only when a poster makes an offer: a
discount, scholarship, cashback, early-bird price, coupon or fee waiver."""

import re

from rules.registry import Problem, RuleContext, rule
from rules.text import evidence, inr

OFFER = re.compile(
    r"(\d{1,3}\s?%\s?(?:off|discount)|\bdiscounts?\b|\bscholarships?\b|\bcash\s?back\b|\bearly[- ]bird\b"
    r"|\bflat\s?(?:₹|rs\.?|inr)\s?\d|\bsave\s?(?:₹|rs\.?|inr|up to)|\b(?:special|limited|festive|diwali|launch|combo)\s+offer\b"
    r"|\bcoupon\b|\bpromo\s?code\b|\bfee\s+waiver\b)", re.I)
VALIDITY = re.compile(
    r"(valid\s+(?:till|until|up\s?to|through)|offer\s+(?:ends|closes|valid)|last\s+date|\btill\b|\buntil\b|ends\s+on"
    r"|\bexpires?\b|\bby\s+\d|\bbefore\s+\d|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b"
    r"|\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|first\s+\d+\s+(?:students|seats|customers|registrations))", re.I)
TERMS = re.compile(
    r"(t\s?&\s?c|t\s?and\s?c|terms\s+(?:and|&)\s+conditions|conditions\s+apply|terms\s+apply|\*\s?conditions|see\s+terms"
    r"|eligibility|\beligible\b)", re.I)
PERCENT = re.compile(r"(\d{1,3})\s?%\s?(?:off|discount)", re.I)
AMOUNT = re.compile(r"(?:₹|\brs\.?\s?|\binr\s?)\s?(\d[\d,]*)", re.I)
SAVE = re.compile(r"save\s?(?:₹|rs\.?\s?|inr\s?)\s?(\d[\d,]*)", re.I)


def _places(ctx: RuleContext) -> list[tuple[str, list[int] | None]]:
    places = [(b.text, b.box_2d) for b in ctx.reading.text_blocks]
    return places + ([(ctx.caption, None)] if ctx.caption else [])


def _offer(ctx: RuleContext) -> tuple[str, list[int] | None] | None:
    return next(((text, box) for text, box in _places(ctx) if OFFER.search(text)), None)


@rule("OFFER-01")
def offers_say_how_long(ctx: RuleContext) -> list[Problem]:
    offer = _offer(ctx)
    if not offer or VALIDITY.search(" \n ".join(text for text, _ in _places(ctx))):
        return []
    text, box = offer
    return [Problem(f"“{text.strip()}” is an offer with no end date.", evidence(box, text),
                    "Say until when it is valid, for example “Valid till 31 December 2026”.")]


@rule("OFFER-02")
def offers_point_to_terms(ctx: RuleContext) -> list[Problem]:
    offer = _offer(ctx)
    if not offer or TERMS.search(" \n ".join(text for text, _ in _places(ctx))):
        return []
    text, box = offer
    return [Problem(f"“{text.strip()}” doesn't say where its conditions are.", evidence(box, text),
                    "Add “T&C apply” and where to read them, or say who qualifies.")]


def _amounts(text: str) -> list[int]:
    return [int(raw.replace(",", "")) for raw in AMOUNT.findall(text) if raw.replace(",", "").isdigit()]


@rule("OFFER-03")
def discounts_add_up(ctx: RuleContext) -> list[Problem]:
    problems = []
    for text, box in _places(ctx):
        amounts = _amounts(text)
        saved = SAVE.search(text)
        if saved:
            saved_amount = int(saved[1].replace(",", ""))
            prices = [a for a in amounts if a != saved_amount]
            if len(prices) >= 2 and max(prices) - min(prices) != saved_amount:
                real = max(prices) - min(prices)
                problems.append(Problem(f"“{text.strip()}” says save {inr(saved_amount)}, but {inr(max(prices))} to "
                                        f"{inr(min(prices))} saves {inr(real)}.", evidence(box, text),
                                        f"Change it to save {inr(real)}, or check the prices."))
                continue
        percent = PERCENT.search(text)
        if percent and len(amounts) >= 2 and max(amounts) > 0:
            stated, high, low = int(percent[1]), max(amounts), min(amounts)
            real = round((high - low) / high * 100)
            if abs(real - stated) > 1:
                problems.append(Problem(f"“{text.strip()}” says {stated}% off, but {inr(high)} to {inr(low)} is {real}% off.",
                                        evidence(box, text), f"Change it to {real}% off, or check the prices."))
    return problems
