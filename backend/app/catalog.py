"""What an organisation does, and which rulebooks it keeps.

catalog.json lists industries (30 groups and their subdomains), kinds of organisation, what they
use Pramaan for, and the words each industry uses ("Courses and fees" for a coaching institute,
"Menu and prices" for a restaurant). The rulebooks themselves are defined in rules/rule_pack.json.

An organisation's industry only suggests rulebooks and picks the words; head office decides which
rulebooks are on. Rules in a rulebook that is off never run.
"""

import json
from functools import lru_cache
from pathlib import Path

from rules.registry import Words, load_rule_pack

CATALOG_PATH = Path(__file__).with_name("catalog.json")
OTHER_INDUSTRY = "Other / not listed"


@lru_cache
def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def industry_group(group_id: str | None) -> dict | None:
    return next((g for g in load_catalog()["industries"] if g["id"] == group_id), None)


def vocabulary(group_id: str | None, industry: str | None) -> dict:
    """The words for an industry: the group's, with a subdomain's own where it has them."""
    catalog = load_catalog()
    group = industry_group(group_id)
    key = (group or {}).get("vocabulary", "default")
    key = (group or {}).get("special", {}).get(industry or "", {}).get("vocabulary", key)
    return catalog["vocabularies"].get(key, catalog["vocabularies"]["default"])


def words(group_id: str | None, industry: str | None) -> Words:
    v = vocabulary(group_id, industry)
    return Words(**{name: v[name] for name in Words.__dataclass_fields__})


def rulebook_ids() -> list[str]:
    return [b.id for b in load_rule_pack().rulebooks]


def required_rulebooks() -> list[str]:
    return [b.id for b in load_rule_pack().rulebooks if b.required]


def complete(rulebooks: list[str]) -> list[str]:
    """Add the rulebooks every organisation keeps, and anything a chosen rulebook depends on,
    in the rule pack's order."""
    chosen = set(rulebooks) | set(required_rulebooks())
    for book in load_rule_pack().rulebooks:
        if book.id in chosen:
            chosen |= set(book.requires)
    return [b for b in rulebook_ids() if b in chosen]


def suggested_rulebooks(group_id: str | None, industry: str | None, org_type: str | None, focus: list[str]) -> list[str]:
    """What an organisation like this starts with: the rulebooks everyone keeps, the general ones that
    act only when a poster shows what they check, and what its industry, subdomain, kind of
    organisation and focus call for."""
    catalog = load_catalog()
    group = industry_group(group_id) or {}
    picks = [b.id for b in load_rule_pack().rulebooks if b.default_on]
    picks += group.get("suggest", [])
    picks += group.get("special", {}).get(industry or "", {}).get("suggest", [])
    picks += next((t.get("suggest", []) for t in catalog["org_types"] if t["id"] == org_type), [])
    for area in catalog["focus_areas"]:
        if area["id"] in focus:
            picks += area["suggest"]
    return complete(picks)


def restricted_claims(group_id: str | None) -> tuple[str, list[str]]:
    """The industry's name and the claims its ads may never make (LEGAL-02)."""
    group = industry_group(group_id) or {}
    return group.get("name", ""), group.get("restricted", [])


class ProfileError(ValueError):
    """The organisation profile names something that isn't in the catalog."""


def check_profile(group_id: str, industry: str, org_type: str, focus: list[str]) -> tuple[str, str, str, list[str]]:
    """Validate and tidy an organisation profile. A subdomain that isn't listed is kept as the
    organisation typed it, so nobody is forced into the wrong box."""
    catalog = load_catalog()
    group = industry_group(group_id)
    if not group:
        raise ProfileError("Choose the industry your organisation works in.")
    industry = " ".join(industry.split())
    if not 2 <= len(industry) <= 80:
        raise ProfileError("Describe what your organisation does in 2 to 80 characters.")
    listed = {s.lower(): s for s in group["subdomains"]}
    industry = listed.get(industry.lower(), industry)
    if org_type not in {t["id"] for t in catalog["org_types"]}:
        raise ProfileError("Choose what kind of organisation it is.")
    known_focus = [a["id"] for a in catalog["focus_areas"]]
    if unknown := [f for f in focus if f not in known_focus]:
        raise ProfileError(f"Unknown focus: {', '.join(unknown)}.")
    return group_id, industry, org_type, [f for f in known_focus if f in focus]


def check_rulebooks(rulebooks: list[str]) -> list[str]:
    if unknown := [r for r in rulebooks if r not in rulebook_ids()]:
        raise ProfileError(f"Unknown rulebook: {', '.join(unknown)}.")
    return complete(rulebooks)
