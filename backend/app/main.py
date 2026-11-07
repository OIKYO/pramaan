"""FastAPI app: CORS and routers. Route logic lives in app/routers/."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import findings, insights, posters, rules, toppers
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
for module in (posters, findings, toppers, rules, insights):
    app.include_router(module.router)


@app.get("/health")
def health() -> dict:
    """Uptime check. Render's free instance sleeps; call this a minute before a demo."""
    return {"ok": True, "reader_mode": settings.reader_mode}
