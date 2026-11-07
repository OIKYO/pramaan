"""FastAPI app: CORS and routers. Route logic lives in app/routers/."""

import logging

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import get_db
from app.routers import account, findings, imports, insights, invites, members, organisations, posters, rules, toppers
from rules.registry import load_rule_pack

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
settings = get_settings()
# Shown in the Render log, so a missing frontend origin is easy to spot.
logging.getLogger("pramaan").info("CORS allows: %s", ", ".join(settings.allowed_origins) or "nothing")
load_rule_pack()  # fail at startup, not on the first poster, if the rule pack and code disagree

app = FastAPI(title="Pramaan API", version="0.2.0",
              description="Checks branch posters against head office's rulebook. The AI reads; code decides; people approve.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)
for module in (organisations, account, members, invites, imports, posters, findings, toppers, rules, insights):
    app.include_router(module.router)


@app.get("/health")
def health(response: Response, db: bool = False) -> dict:
    """Uptime check. Render's free instance sleeps; call this a minute before a demo.

    With `?db=true` it also reads one row from the database. The keep-awake job uses this, which keeps
    the free Supabase project active too (it pauses after a week without use).
    """
    body = {"ok": True, "reader_mode": settings.reader_mode}
    if db:
        try:
            get_db().table("regions").select("id").limit(1).execute()
            body["database"] = "ok"
        except Exception:  # report it plainly; the job then fails and GitHub emails the owner
            logging.getLogger("pramaan").exception("health check: database unreachable")
            response.status_code = 503
            body.update(ok=False, database="unreachable")
    return body
