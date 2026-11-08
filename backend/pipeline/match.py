from rapidfuzz import fuzz
from rapidfuzz.utils import default_process

from app.models import Finding, PersonMatch, PosterReading, Topper
from rules.registry import Problem, rule_def, to_finding
from rules.text import evidence

MATCH_SCORE = 85  # at or above: the same person
ASK_SCORE = 70    # between ASK_SCORE and MATCH_SCORE: a person decides


def match_people(reading: PosterReading, toppers: list[Topper]) -> list[PersonMatch]:
    matches = []
    for index, person in enumerate(reading.people):
        name = person.romanised_name or person.name
        best_id, best_score = None, 0.0
        for topper in toppers:
            for candidate in [topper.full_name, *topper.name_variants]:
                score = fuzz.WRatio(name, candidate, processor=default_process)
                if score > best_score:
                    best_id, best_score = topper.id, score
        status = "match" if best_score >= MATCH_SCORE else "needs_human" if best_score >= ASK_SCORE else "no_match"
        matches.append(PersonMatch(
            person_index=index,
            topper_id=best_id if status != "no_match" else None,
            score=round(best_score, 1),
            status=status,
        ))
    return matches


def identity_findings(
    reading: PosterReading, matches: list[PersonMatch], tagged_ids: list[str], toppers: dict[str, Topper]
) -> list[Finding]:
    found: list[Finding] = []
    detected = set()
    for m in matches:
        person = reading.people[m.person_index]
        where = evidence(person.box_2d, person.name)
        if m.status == "needs_human":
            topper = toppers[m.topper_id]
            found.append(to_finding("READ-03", Problem(
                f"“{person.name}” may be {topper.full_name} ({m.score:.0f}% similar), but Pramaan isn't sure.",
                {**where, "topper_id": topper.id},
                f"Confirm whether this is {topper.full_name}, or correct the name on the poster.",
            )))
        if m.topper_id:
            detected.add(m.topper_id)
        if m.topper_id not in tagged_ids:
            found.append(to_finding("READ-03", Problem(
                f"{person.name} appears on the poster but wasn't tagged when it was uploaded.", where,
                "Tag the student shown, or confirm who it is.",
            )))
    for topper_id in tagged_ids:
        if topper_id not in detected and topper_id in toppers:
            found.append(to_finding("READ-03", Problem(
                f"{toppers[topper_id].full_name} was tagged, but Pramaan didn't find them on the poster.", {},
                "Remove the tag, or check that their name is printed on the poster.",
                severity="warn",
            )))
    if not found:
        found.append(Finding(rule_id="READ-03", kind="reader", severity="pass", message="Passed",
                             reason=rule_def("READ-03").reason))
    return found
