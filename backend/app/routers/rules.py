"""The rule pack, with each check's on/off setting from the rule_settings table."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import current_user
from app.db import get_db
from app.models import Profile, RuleOut, RulePackOut
from rules.registry import load_rule_pack

router = APIRouter(tags=["rules"])


@router.get("/rules", response_model=RulePackOut)
def rules(user: Annotated[Profile, Depends(current_user)]) -> RulePackOut:
    pack = load_rule_pack()
    enabled = {r["rule_id"]: r["enabled"] for r in get_db().table("rule_settings").select("*").execute().data}
    return RulePackOut(
        version=pack.version, source=pack.source, reader_checks=pack.reader_checks,
        rules=[RuleOut(**{**r.model_dump(), "enabled": enabled.get(r.id, r.enabled)}) for r in pack.rules],
    )
