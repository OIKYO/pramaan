"""FastAPI app: CORS and routers. Route logic lives in app/routers/."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()

app = FastAPI(title="Pramaan API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Uptime check. Render's free instance sleeps; call this a minute before a demo."""
    return {"ok": True, "reader_mode": settings.reader_mode}
