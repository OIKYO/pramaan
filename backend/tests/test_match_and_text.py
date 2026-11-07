from app.models import Person
from pipeline.match import identity_findings, match_people
from rules.text import duration_months, inr, norm, phone_key
from tests.builders import TOPPERS, clean_reading, topper_id


def reading_with(*names: str):
    reading = clean_reading()
    reading.people = [Person(name=n, box_2d=[100, 100, 200, 200]) for n in names]
    return reading


def test_names_match_the_register_including_variants():
    matches = match_people(reading_with("Riya Sen", "Ria Sen", "PRIYA MANDAL"), list(TOPPERS.values()))
    assert [m.status for m in matches] == ["match", "match", "match"]
    assert matches[2].topper_id == topper_id("Priya Mondal")


def test_unknown_names_dont_match():
    [m] = match_people(reading_with("Rohit Verma"), list(TOPPERS.values()))
    assert m.status == "no_match" and m.topper_id is None


def test_untagged_people_and_missing_tags_go_to_a_person():
    reading = reading_with("Riya Sen")
    matches = match_people(reading, list(TOPPERS.values()))
    findings = identity_findings(reading, matches, [topper_id("Arjun Das")], TOPPERS)
    by_severity = {f.severity: f.message for f in findings}
    assert "wasn't tagged" in by_severity["needs_human"]
    assert "Arjun Das was tagged" in by_severity["warn"]


def test_correct_tags_pass():
    reading = reading_with("Riya Sen")
    matches = match_people(reading, list(TOPPERS.values()))
    [finding] = identity_findings(reading, matches, [topper_id("Riya Sen")], TOPPERS)
    assert finding.severity == "pass"


def test_text_helpers():
    assert inr(48000) == "₹48,000" and inr(120000) == "₹1,20,000" and inr(950) == "₹950"
    assert duration_months("2-Year Classroom Programme") == 24
    assert duration_months("six months") == 6 and duration_months("no duration") is None
    assert phone_key("+91 10000 22102") == phone_key("10000-22102") == "1000022102"
    assert norm("১০০ %  Selection") == "100% selection"
