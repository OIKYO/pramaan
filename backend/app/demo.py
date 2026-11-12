from fastapi import HTTPException

# Northfield Academy, the shared demo anyone can sign in to (scripts/seed.py makes it with this id).
DEMO_ORG_ID = "00000000-0000-4000-8000-000000000001"


def not_in_demo(org_id: str | None, what: str) -> None:
    """Refuse what would spoil the demo for the next person: deleting it, locking people out, adding accounts."""
    if org_id == DEMO_ORG_ID:
        raise HTTPException(403, f"This is the shared demo, so {what} is switched off here. "
                                 "Create your own organisation to try it.")
