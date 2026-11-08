import json
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date
from functools import lru_cache
from pathlib import Path

from app.models import (
    BrandKit, Branch, Course, Finding, PersonMatch, PosterReading, ResultStat, RuleDef, RulePack, Severity,
    Topper, VisualReport,
)

RULE_PACK_PATH = Path(__file__).with_name("rule_pack.json")


@dataclass(frozen=True)
class Words:
    offering: str = "product"
    offering_plural: str = "products"
    price: str = "price"
    figure: str = "approved figure"
    person: str = "person"
    person_plural: str = "people"
    register_name: str = "consent register"


@dataclass
class RuleContext:
    reading: PosterReading
    people: list[PersonMatch]
    tagged_topper_ids: list[str]
    brand_kit: BrandKit
    courses: list[Course]
    result_stats: list[ResultStat]
    toppers: dict[str, Topper]
    branch: Branch
    channel: str
    caption: str = ""
    alt_text: str = ""
    visual: VisualReport | None = None
    today: date = field(default_factory=date.today)
    words: Words = field(default_factory=Words)
    industry: str = ""  # the industry group's name, e.g. "Finance & Banking"
    restricted: list[str] = field(default_factory=list)  # claims this industry may never make (LEGAL-02)

    def matched(self):
        for m in self.people:
            if m.status == "match" and m.topper_id in self.toppers:
                yield self.reading.people[m.person_index], self.toppers[m.topper_id]

    def course(self, course_id: str | None) -> Course | None:
        return next((c for c in self.courses if c.id == course_id), None)


@dataclass
class Problem:
    message: str
    evidence: dict = field(default_factory=dict)
    suggested_fix: str | None = None
    severity: Severity | None = None  # defaults to the rule's severity from the pack


RuleFn = Callable[[RuleContext], list[Problem]]
_RULES: dict[str, RuleFn] = {}


def rule(rule_id: str) -> Callable[[RuleFn], RuleFn]:
    def register(fn: RuleFn) -> RuleFn:
        if rule_id in _RULES:
            raise ValueError(f"{rule_id} is registered twice")
        _RULES[rule_id] = fn
        return fn

    return register


@lru_cache
def load_rule_pack() -> RulePack:
    pack = RulePack.model_validate(json.loads(RULE_PACK_PATH.read_text(encoding="utf-8")))
    _import_rule_modules()
    pack_ids = {r.id for r in pack.rules}
    books = {b.id for b in pack.rulebooks}
    if stray := {book for r in pack.rules for book in r.rulebooks} - books:
        raise RuntimeError(f"Rules name rulebooks that rule_pack.json doesn't define: {sorted(stray)}")
    if missing := pack_ids - _RULES.keys():
        raise RuntimeError(f"Rules in rule_pack.json with no code: {sorted(missing)}")
    if extra := _RULES.keys() - pack_ids:
        raise RuntimeError(f"Rules in code missing from rule_pack.json: {sorted(extra)}")
    return pack


def _import_rule_modules() -> None:
    from rules import access, brand, claims, dates, facts, legal, offers, rights  # noqa: F401  (importing registers the rules)


def rule_def(rule_id: str) -> RuleDef:
    pack = load_rule_pack()
    return next(r for r in [*pack.rules, *pack.reader_checks] if r.id == rule_id)


def to_finding(rule_id: str, problem: Problem) -> Finding:
    rd = rule_def(rule_id)
    severity = problem.severity or rd.severity
    if rd.kind == "ai":
        severity = "warn"  # AI findings never block on their own.
    return Finding(
        rule_id=rd.id, kind=rd.kind, severity=severity, message=problem.message, reason=rd.reason,
        evidence=problem.evidence, suggested_fix=problem.suggested_fix,
    )


def rule_applies(rd: RuleDef, rulebooks: set[str] | None) -> bool:
    """None means every rulebook."""
    return rulebooks is None or not rd.rulebooks or bool(rulebooks & set(rd.rulebooks))


def run_rules(ctx: RuleContext, enabled: dict[str, bool] | None = None, rulebooks: set[str] | None = None) -> list[Finding]:
    """Rule ids missing from rule_settings use the pack's `enabled`."""
    findings: list[Finding] = []
    for rd in load_rule_pack().rules:
        if not rule_applies(rd, rulebooks) or not (enabled or {}).get(rd.id, rd.enabled):
            continue
        problems = _RULES[rd.id](ctx)
        if problems:
            findings += [to_finding(rd.id, p) for p in problems]
        else:
            findings.append(Finding(rule_id=rd.id, kind=rd.kind, severity="pass", message="Passed", reason=rd.reason))
    return findings
