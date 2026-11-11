from datetime import date

import pytest

from app.models import ContrastReading, NumberSeen, PaletteCluster, TextBlock, WordingFlag
from rules.registry import _RULES, load_rule_pack, run_rules
from tests.builders import TOPPERS, clean_reading, clean_visual, make_ctx, topper_id, with_person


def problems(ctx, rule_id: str):
    return [f for f in run_rules(ctx) if f.rule_id == rule_id and f.severity != "pass"]


def add_block(reading, text: str, romanised: str = ""):
    block = TextBlock(text=text, romanised=romanised, box_2d=[800, 100, 840, 900])
    return reading.model_copy(update={"text_blocks": [*reading.text_blocks, block]})


def add_number(reading, kind: str, raw: str, value=None):
    number = NumberSeen(kind=kind, raw_text=raw, value=value, box_2d=[800, 100, 840, 400])
    return reading.model_copy(update={"numbers": [*reading.numbers, number]})


def test_rule_pack_has_27_checks_all_with_code():
    pack = load_rule_pack()
    assert len(pack.rules) == 27
    assert {r.id for r in pack.rules} == set(_RULES)
    assert sum(r.kind == "code" for r in pack.rules) == 25
    assert all(r.reason for r in pack.rules)


def test_clean_poster_passes_all_27():
    findings = run_rules(make_ctx())
    assert len(findings) == 27
    assert [f for f in findings if f.severity != "pass"] == []


def test_disabled_rules_are_skipped():
    findings = run_rules(make_ctx(), enabled={"ACC-01": False})
    assert "ACC-01" not in {f.rule_id for f in findings}
    assert len(findings) == 26


def test_ccpa01_banned_claim_blocks():
    found = problems(make_ctx(add_block(clean_reading(), "100% selection guaranteed!")), "CCPA-01")
    assert len(found) == 1 and found[0].severity == "block"
    assert "42" in found[0].suggested_fix  # fix is built from the approved figure


@pytest.mark.parametrize(("text", "romanised"), [
    ("১০০% সিলেকশন", ""),
    ("चयन की गारंटी", "chayan ki guarantee"),
    ("Assured selection for every student", ""),  # from brand_kit.banned_phrases
])
def test_ccpa01_catches_hindi_bengali_and_brand_kit_phrases(text, romanised):
    assert problems(make_ctx(add_block(clean_reading(), text, romanised)), "CCPA-01")


def test_ccpa01_checks_the_caption():
    found = problems(make_ctx(caption="Join now, guaranteed rank!"), "CCPA-01")
    assert found and found[0].message.startswith("The caption")


def test_ccpa02_no_consent_blocks():
    reading = with_person(clean_reading(), name="Arjun Das", rank_text="AIR 112", rank_value=112)
    found = problems(make_ctx(reading), "CCPA-02")
    assert len(found) == 1 and "Arjun Das" in found[0].message


def test_ccpa02_person_not_in_register_blocks():
    reading = with_person(clean_reading(), name="Rohit Verma")
    assert problems(make_ctx(reading), "CCPA-02")


def test_ccpa03_consent_before_result_blocks():
    reading = with_person(clean_reading(), name="Karan Thapa", rank_text="AIR 340", rank_value=340,
                          course_text="1-Year Crash Course", duration_text="1 year")
    found = problems(make_ctx(reading), "CCPA-03")
    assert len(found) == 1 and "before the result" in found[0].message


def test_ccpa03_wrong_channel_expired_and_minor_without_guardian():
    riya = TOPPERS[topper_id("Riya Sen")]
    toppers = {**TOPPERS, riya.id: riya.model_copy(update={
        "consent_channels": ["print"], "is_minor": True, "guardian_signed": False,
        "consent_valid_until": date(2026, 10, 1),
    })}
    found = problems(make_ctx(channel="instagram", alt_text="Riya Sen, AIR 73, with course details", toppers=toppers), "CCPA-03")
    messages = " ".join(f.message for f in found)
    assert len(found) == 3
    assert "not instagram" in messages and "expired" in messages and "guardian" in messages


def test_ccpa03_minor_with_guardian_consent_passes():
    reading = with_person(clean_reading(), name="Ananya Roy", rank_text="AIR 58", rank_value=58)
    assert problems(make_ctx(reading), "CCPA-03") == []


def test_ccpa04_wrong_rank_blocks_with_fix_from_register():
    reading = with_person(clean_reading(), rank_text="AIR 37", rank_value=37)
    found = problems(make_ctx(reading), "CCPA-04")
    assert found[0].suggested_fix == "Change the rank to AIR 73."


def test_ccpa05_wrong_course_details_block():
    # Priya took the free test series, but the poster presents her as a classroom topper.
    reading = with_person(clean_reading(), name="Priya Mondal", rank_text="AIR 205", rank_value=205)
    found = problems(make_ctx(reading), "CCPA-05")
    assert len(found) == 1
    assert "isn't the one they took" in found[0].message and "free" in found[0].message
    assert "All-India Test Series · 6 months · free" in found[0].suggested_fix


def test_ccpa05_missing_details_block():
    reading = with_person(clean_reading(), course_text="", duration_text="", paid_text="")
    found = problems(make_ctx(reading), "CCPA-05")
    assert "no course" in found[0].message and "no paid or free label" in found[0].message


def test_ccpa06_unapproved_figure_blocks():
    reading = clean_reading()
    reading.numbers[1] = reading.numbers[1].model_copy(update={"raw_text": "52", "value": 52})
    reading.text_blocks[5] = reading.text_blocks[5].model_copy(update={"text": "52 classroom students qualified JEE Main 2026"})
    found = problems(make_ctx(reading), "CCPA-06")
    assert found and "42" in found[0].suggested_fix


def test_fact01_wrong_duration_in_course_name_blocks():
    found = problems(make_ctx(add_block(clean_reading(), "2-Year Crash Course for JEE")), "FACT-01")
    assert found and "1 year" in found[0].message


def test_fact01_unknown_course_blocks():
    assert problems(make_ctx(add_block(clean_reading(), "New 3-Year Foundation Batch")), "FACT-01")


def test_fact02_wrong_fee_blocks():
    reading = clean_reading()
    reading.numbers[2] = reading.numbers[2].model_copy(update={"raw_text": "₹45,000", "value": 45000})
    reading.text_blocks[6] = reading.text_blocks[6].model_copy(update={"text": "2-Year Classroom Programme: ₹45,000"})
    found = problems(make_ctx(reading), "FACT-02")
    assert found[0].suggested_fix == "Change the fee to ₹48,000."


def test_fact02_fee_on_a_free_course_blocks():
    reading = add_block(clean_reading(), "All-India Test Series: ₹5,000")
    reading = add_number(reading, "fee", "₹5,000", 5000)
    assert "free" in problems(make_ctx(reading), "FACT-02")[0].message


def test_fact03_wrong_phone_blocks():
    found = problems(make_ctx(add_number(clean_reading(), "phone", "+91 10000 22199")), "FACT-03")
    assert "+91 10000 22102" in found[0].suggested_fix


def test_fact03_another_branchs_number_blocks():
    assert problems(make_ctx(add_number(clean_reading(), "phone", "+91 10000 22101")), "FACT-03")


def test_fact03_wrong_address_blocks():
    reading = add_block(clean_reading(), "Visit us: 9 Station Road, Siliguri 734005")
    assert problems(make_ctx(reading), "FACT-03")
    right = add_block(clean_reading(), "2nd floor, 14 Hill Cart Road, Siliguri 734001")
    assert problems(make_ctx(right), "FACT-03") == []


def test_fact04_expired_facts_warn():
    found = problems(make_ctx(today=date(2027, 4, 15)), "FACT-04")
    assert found and all(f.severity == "warn" for f in found)
    assert any("figure" in f.message for f in found)


def test_brand01_missing_logo_warns():
    visual = clean_visual().model_copy(update={"logo_score": 0.41})
    found = problems(make_ctx(visual=visual), "BRAND-01")
    assert found and found[0].severity == "warn"


def test_brand01_without_image_analysis_is_not_a_silent_pass():
    assert problems(make_ctx(visual=None), "BRAND-01")


def test_brand02_off_palette_colour_warns_but_small_areas_dont():
    visual = clean_visual()
    visual.palette = [*visual.palette, PaletteCluster(hex="#E6007E", share=0.08, delta_e=60)]
    assert problems(make_ctx(visual=visual), "BRAND-02") == []
    visual.palette[-1] = PaletteCluster(hex="#E6007E", share=0.35, delta_e=60)
    assert problems(make_ctx(visual=visual), "BRAND-02")


def test_brand03_missing_name_and_helpline_warn():
    reading = clean_reading()
    reading.text_blocks = reading.text_blocks[:-1]
    reading.numbers = reading.numbers[:-1]
    reading.registered_name_seen = reading.helpline_seen = False
    assert len(problems(make_ctx(reading), "BRAND-03")) == 2


def test_ai_flags_warn_and_unknown_rule_ids_are_not_findings():
    reading = clean_reading()
    reading.wording_flags = [
        WordingFlag(text="Selection pakka!", rule_id="AI-01", why="Promises selection.", box_2d=[1, 1, 2, 2],
                    suggested_rewrite="Prepare with expert guidance"),
        WordingFlag(text="Last chance, don't fall behind", rule_id="BRAND-04", why="Pressures parents.", box_2d=[1, 1, 2, 2]),
        WordingFlag(text="Something odd", rule_id="CCPA-99", why="?", box_2d=[1, 1, 2, 2]),
    ]
    findings = run_rules(make_ctx(reading))
    ai = [f for f in findings if f.kind == "ai" and f.severity != "pass"]
    assert {f.rule_id for f in ai} == {"AI-01", "BRAND-04"}
    assert all(f.severity == "warn" for f in ai)
    assert next(f for f in ai if f.rule_id == "AI-01").suggested_fix.startswith("AI suggestion:")
    assert "CCPA-99" not in {f.rule_id for f in findings}


def test_acc01_low_contrast_warns():
    visual = clean_visual()
    visual.contrast[8] = ContrastReading(block_index=8, ratio=2.1, fg="#BBBBBB", bg="#FFFFFF")
    found = problems(make_ctx(visual=visual), "ACC-01")
    assert len(found) == 1 and "2.1:1" in found[0].message


@pytest.mark.parametrize(("channel", "alt_text", "fails"), [
    ("print", "", False),
    ("instagram", "", True),
    ("whatsapp", "A poster", True),
    ("instagram", "Riya Sen, AIR 73 in JEE Main 2026, 2-Year Classroom Programme, with branch phone number.", False),
])
def test_acc02_alt_text_on_social_posts(channel, alt_text, fails):
    assert bool(problems(make_ctx(channel=channel, alt_text=alt_text), "ACC-02")) is fails


def test_acc01_large_text_needs_only_three_to_one():
    reading = clean_reading()
    big = reading.text_blocks[0].model_copy(update={"text": "RS", "box_2d": [300, 80, 340, 200]})  # 4% of the height
    small = reading.text_blocks[0].model_copy(update={"text": "small print", "box_2d": [900, 80, 920, 600]})
    reading = reading.model_copy(update={"text_blocks": [big, small]})
    visual = clean_visual(2).model_copy(update={"contrast": [
        ContrastReading(block_index=0, ratio=4.0, fg="#FFFFFF", bg="#238A7D"),
        ContrastReading(block_index=1, ratio=4.0, fg="#999999", bg="#FFFFFF"),
    ]})
    found = problems(make_ctx(reading, visual=visual), "ACC-01")
    assert [p.evidence["text"] for p in found] == ["small print"]
    visual.contrast[0] = ContrastReading(block_index=0, ratio=2.5, fg="#FFFFFF", bg="#EEEEEE")
    assert {p.evidence["text"] for p in problems(make_ctx(reading, visual=visual), "ACC-01")} == {"RS", "small print"}


def test_ccpa06_ignores_numbers_that_are_not_results_figures():
    def with_stat(text, raw):
        reading = add_block(clean_reading(), text)
        return reading.model_copy(update={"numbers": [*reading.numbers, NumberSeen(kind="stat", raw_text=raw, value=None,
                                                                                   box_2d=reading.text_blocks[-1].box_2d)]})
    assert not problems(make_ctx(with_stat("Siliguri branch: +91 10000 22102", "+91 10000 22102")), "CCPA-06")
    assert not problems(make_ctx(with_stat("Early-bird discount: 20% off", "20%")), "CCPA-06")
    assert not problems(make_ctx(with_stat("100% selection guaranteed", "100%")), "CCPA-06")
    assert problems(make_ctx(with_stat("98% of our students cleared JEE Main", "98%")), "CCPA-06")


def test_a_number_belongs_to_the_line_its_box_is_on():
    reading = clean_reading()
    phone = TextBlock(text="Siliguri branch: +91 10000 22102", box_2d=[700, 100, 740, 900])
    claim = TextBlock(text="Guaranteed rank in the top 1000", box_2d=[800, 100, 840, 900])
    reading = reading.model_copy(update={"text_blocks": [phone, claim], "numbers": [
        NumberSeen(kind="stat", raw_text="1000", value=1000, box_2d=[805, 700, 835, 800])]})
    assert not problems(make_ctx(reading), "CCPA-06")  # the banned claim, not the phone line, holds the number

