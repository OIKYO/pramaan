import pytest

from app.catalog import (
    ProfileError, check_profile, check_rulebooks, complete, load_catalog, suggested_rulebooks, vocabulary, words,
)
from rules.registry import load_rule_pack, run_rules
from tests.builders import clean_reading, make_ctx

BOOKS = {b.id for b in load_rule_pack().rulebooks}


def test_the_catalog_only_names_things_that_exist():
    catalog = load_catalog()
    for group in catalog["industries"]:
        assert group["vocabulary"] in catalog["vocabularies"], group["id"]
        assert set(group["suggest"]) <= BOOKS, group["id"]
        for name, special in group.get("special", {}).items():
            assert name in group["subdomains"], name
            assert special.get("vocabulary", "default") in catalog["vocabularies"]
            assert set(special.get("suggest", [])) <= BOOKS
    for area in catalog["focus_areas"]:
        assert set(area["suggest"]) <= BOOKS
    assert len(catalog["industries"]) == 30


ALWAYS = {"brand", "contacts", "claims", "people", "rights"}


def test_every_organisation_keeps_the_always_on_rulebooks_and_dependencies_come_along():
    assert set(complete([])) == ALWAYS
    assert set(complete(["rankings"])) == ALWAYS | {"offerings", "rankings"}


def test_new_organisations_start_with_rulebooks_for_their_industry_and_kind():
    general = {"dates", "offers", "legal"}  # conditional rulebooks every organisation starts with
    coaching = set(suggested_rulebooks("education", "Coaching Institutes", "coaching", []))
    assert ALWAYS | general | {"rankings", "offerings", "figures"} == coaching
    restaurant = set(suggested_rulebooks("food", "Restaurants", "chain", []))
    assert restaurant == ALWAYS | general | {"offerings"}
    assert "figures" in suggested_rulebooks("food", "Restaurants", "chain", ["campaigns"])
    assert "rankings" in suggested_rulebooks("other", "Something new", "coaching", [])  # the kind alone can call for it


def test_words_follow_the_industry_and_its_subdomain():
    assert vocabulary("food", "Restaurants")["offerings"] == "Menu and prices"
    assert vocabulary("education", "Schools")["people"] == "Students and consent"
    assert vocabulary("education", "Coaching Institutes")["people"] == "Toppers register"
    assert vocabulary(None, None)["offerings"] == "Products and prices"
    assert words("education", "Coaching Institutes").price == "fee"


def test_profiles_are_checked_against_the_catalog():
    assert check_profile("food", "  restaurants ", "chain", ["offers"]) == ("food", "Restaurants", "chain", ["offers"])
    assert check_profile("food", "South Indian tiffin rooms", "chain", [])[1] == "South Indian tiffin rooms"
    with pytest.raises(ProfileError):
        check_profile("cooking", "Restaurants", "chain", [])
    with pytest.raises(ProfileError):
        check_profile("food", "Restaurants", "empire", [])
    with pytest.raises(ProfileError):
        check_rulebooks(["brand", "astrology"])


def wrong_fee():
    reading = clean_reading()
    reading.numbers[2] = reading.numbers[2].model_copy(update={"raw_text": "₹45,000", "value": 45000})
    reading.text_blocks[6] = reading.text_blocks[6].model_copy(update={"text": "2-Year Classroom Programme: ₹45,000"})
    return reading


def test_checks_in_a_rulebook_the_organisation_doesnt_keep_never_run():
    ctx = make_ctx(wrong_fee())
    every = {f.rule_id for f in run_rules(ctx)}
    only_brand = {f.rule_id for f in run_rules(ctx, rulebooks={"brand", "contacts"})}
    assert {"FACT-02", "CCPA-04", "CCPA-02"} <= every
    assert only_brand == {"BRAND-01", "BRAND-02", "BRAND-03", "BRAND-04", "ACC-01", "ACC-02", "FACT-03"}


def test_findings_use_the_organisations_own_words():
    ctx = make_ctx(wrong_fee())
    ctx.words = words("food", "Restaurants")
    found = [f for f in run_rules(ctx) if f.rule_id == "FACT-02" and f.severity != "pass"]
    assert found and "approved price" in found[0].message
