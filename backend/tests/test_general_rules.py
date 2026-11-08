from app.models import BrandSeen
from tests.builders import BRAND_KIT, clean_reading, make_ctx
from tests.test_rules import add_block, problems


def poster(*lines: str):
    reading = clean_reading()
    for line in lines:
        reading = add_block(reading, line)
    return reading


# TODAY is 7 Nov 2026

def test_event01_impossible_dates_block():
    assert not problems(make_ctx(), "EVENT-01")
    found = problems(make_ctx(poster("Admissions close 31 February 2027")), "EVENT-01")
    assert len(found) == 1 and "isn't a real date" in found[0].message and "28 days" in found[0].suggested_fix
    assert problems(make_ctx(poster("Classes from 31/04/2027")), "EVENT-01")  # April has 30 days
    assert not problems(make_ctx(poster("Classes from 29 Feb")), "EVENT-01")  # no year: could be a leap year


def test_event02_the_weekday_must_match_the_date():
    assert not problems(make_ctx(poster("New batch starts Sunday, 14 March 2027")), "EVENT-02")
    found = problems(make_ctx(poster("New batch starts Monday, 14th March 2027")), "EVENT-02")
    assert len(found) == 1 and "is a Sunday, not a Monday" in found[0].message
    assert "Sunday, 14 March 2027" in found[0].suggested_fix


def test_event03_deadlines_that_have_passed_block():
    found = problems(make_ctx(poster("Last date to apply: 31 October 2026")), "EVENT-03")
    assert len(found) == 1 and "has passed" in found[0].message
    assert not problems(make_ctx(poster("Last date to apply: 30 November 2026")), "EVENT-03")
    assert not problems(make_ctx(poster("Results declared on 19 April 2026")), "EVENT-03")  # a past result is fine
    # "close", "closing" and "end" after what is closing, not only "closes" and "ends"
    for line in ("Admissions close: Monday, 31 October 2026", "Applications closing 31 October 2026",
                 "Closing date: 31 October 2026", "Offer ending 31 October 2026"):
        assert problems(make_ctx(poster(line)), "EVENT-03"), line
    assert not problems(make_ctx(poster("Admissions close: Monday, 30 November 2026")), "EVENT-03")
    assert not problems(make_ctx(poster("Doors close at the end of 31 October 2026")), "EVENT-03")  # not a deadline word


def test_offer01_offers_need_an_end_date():
    assert not problems(make_ctx(), "OFFER-01")
    assert problems(make_ctx(poster("Early-bird discount: 20% off", "T&C apply")), "OFFER-01")
    assert not problems(make_ctx(poster("Early-bird discount: 20% off till 30 November 2026", "T&C apply")), "OFFER-01")


def test_offer02_offers_point_to_their_conditions():
    assert problems(make_ctx(poster("Scholarships up to 50% for toppers, valid till 30 Nov 2026")), "OFFER-02")
    assert not problems(make_ctx(poster("Scholarships up to 50% for toppers, valid till 30 Nov 2026", "*Conditions apply")),
                        "OFFER-02")


def test_offer03_discounts_must_add_up():
    found = problems(make_ctx(poster("Was ₹48,000, now ₹36,000: 30% off")), "OFFER-03")
    assert len(found) == 1 and "is 25% off" in found[0].message and found[0].suggested_fix.startswith("Change it to 25% off")
    assert not problems(make_ctx(poster("Was ₹48,000, now ₹36,000: 25% off")), "OFFER-03")
    saved = problems(make_ctx(poster("Save ₹10,000: was ₹48,000, now ₹36,000")), "OFFER-03")
    assert len(saved) == 1 and "saves ₹12,000" in saved[0].message


def test_rights01_stock_watermarks_block():
    assert not problems(make_ctx(), "RIGHTS-01")
    found = problems(make_ctx(poster("shutterstock · 2215559811")), "RIGHTS-01")
    assert len(found) == 1 and "watermark" in found[0].message


def test_rights02_other_organisations_must_be_approved_partners():
    reading = clean_reading().model_copy(update={"other_brands": [BrandSeen(name="IIT Bombay", box_2d=[100, 100, 150, 300])]})
    found = problems(make_ctx(reading), "RIGHTS-02")
    assert len(found) == 1 and "IIT Bombay" in found[0].message
    ctx = make_ctx(reading)
    ctx.brand_kit = BRAND_KIT.model_copy(update={"approved_partners": ["IIT Bombay"]})
    assert not problems(ctx, "RIGHTS-02")


def test_legal01_required_disclaimers_must_be_printed():
    ctx = make_ctx()
    ctx.brand_kit = BRAND_KIT.model_copy(update={"required_disclaimers": ["Northfield Academy Pvt. Ltd."]})
    assert not problems(ctx, "LEGAL-01")
    ctx.brand_kit = BRAND_KIT.model_copy(update={"required_disclaimers": ["Fees once paid are not refundable."]})
    found = problems(ctx, "LEGAL-01")
    assert len(found) == 1 and "Fees once paid are not refundable." in found[0].message


def test_legal02_claims_the_industry_forbids_block():
    ctx = make_ctx(poster("Guaranteed returns of 12% every year"))
    assert not problems(ctx, "LEGAL-02")  # this industry forbids nothing yet
    ctx.industry, ctx.restricted = "Finance & Banking", ["guaranteed returns"]
    found = problems(ctx, "LEGAL-02")
    assert len(found) == 1 and "Finance & Banking ads may not claim" in found[0].message
    assert not problems(make_ctx(), "LEGAL-02")
