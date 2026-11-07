"""Head office's overview: where problems come from, which rules fire, which get overridden."""

from collections import Counter
from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import require
from app.db import get_db
from app.models import CountItem, Insights, Profile
from rules.registry import load_rule_pack

router = APIRouter(tags=["insights"])
STATUS_LABELS = {"draft": "Being checked", "checked": "Checked", "in_review": "In review",
                 "changes_requested": "Sent back", "approved": "Approved"}


def _items(counter: Counter, labels: dict[str, str]) -> list[CountItem]:
    return [CountItem(key=k, label=labels.get(k, k), count=n) for k, n in counter.most_common()]


@router.get("/insights", response_model=Insights)
def insights(user: Annotated[Profile, Depends(require("head_office"))]) -> Insights:
    db = get_db()
    posters = (db.table("posters").select("id, status, current_version, branches(name)")
               .eq("org_id", user.org_id).execute().data)
    ids = [p["id"] for p in posters]
    versions = db.table("poster_versions").select("id, poster_id, version").in_("poster_id", ids).execute().data if ids else []
    latest = {p["id"]: p["current_version"] for p in posters}
    current = {v["id"]: v["poster_id"] for v in versions if latest[v["poster_id"]] == v["version"]}
    version_ids = [v["id"] for v in versions]
    findings = (db.table("findings").select("version_id, rule_id, severity, status").in_("version_id", version_ids)
                .execute().data if version_ids else [])
    branch_of = {p["id"]: p["branches"]["name"] for p in posters}
    names = {r.id: f"{r.id} {r.name}" for r in [*load_rule_pack().rules, *load_rule_pack().reader_checks]}

    problems = [f for f in findings if f["version_id"] in current and f["severity"] != "pass"]
    ai_calls = (db.table("audit_log").select("id", count="exact").eq("org_id", user.org_id)
                .eq("action", "ai_call").execute().count or 0)
    return Insights(
        posters_by_status=_items(Counter(p["status"] for p in posters), STATUS_LABELS),
        issues_by_branch=_items(Counter(branch_of[current[f["version_id"]]] for f in problems), {}),
        issues_by_rule=_items(Counter(f["rule_id"] for f in problems), names),
        most_overridden=_items(Counter(f["rule_id"] for f in findings if f["status"] == "overridden"), names),
        total_posters=len(posters),
        open_blocking=sum(f["status"] == "open" and f["severity"] in ("block", "needs_human") for f in problems),
        ai_calls=ai_calls,
    )
