from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import current_user
from app.catalog import complete
from app.db import get_db
from app.models import Profile, RulebookOut, RuleOut, RulePackOut
from rules.registry import load_rule_pack

router = APIRouter(tags=["rules"])


@router.get("/rules", response_model=RulePackOut)
def rules(user: Annotated[Profile, Depends(current_user)]) -> RulePackOut:
    pack = load_rule_pack()
    db = get_db()
    rows = db.table("rule_settings").select("rule_id, enabled").eq("org_id", user.org_id).execute().data
    enabled = {r["rule_id"]: r["enabled"] for r in rows}
    org = db.table("organisations").select("rulebooks").eq("id", user.org_id).single().execute().data
    kept = set(complete(org.get("rulebooks") or []))
    return RulePackOut(
        version=pack.version, source=pack.source, reader_checks=pack.reader_checks,
        rulebooks=[RulebookOut(**b.model_dump(), enabled=b.id in kept) for b in pack.rulebooks],
        rules=[RuleOut(**{**r.model_dump(), "enabled": enabled.get(r.id, r.enabled)}) for r in pack.rules],
    )
