"""Settings, read once from environment variables.

In development, values come from backend/.env (loaded here, so `uvicorn`, `pytest` and the
scripts all see the same settings). In production (Render), they come from the service's
environment. Real environment variables always win over the file.
"""

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent


def load_env_file(path: Path) -> None:
    """Minimal .env reader: KEY=value lines, # comments. Doesn't override real env vars."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.split(" #", 1)[0].strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_secret_key: str
    gemini_api_key: str
    gemini_model: str
    reader_mode: str  # "fixture" reads tests/fixtures/readings; "live" calls Gemini
    allowed_origins: tuple[str, ...]
    tesseract_cmd: str
    demo_password: str
    groq_api_key: str
    groq_model: str


@lru_cache
def get_settings() -> Settings:
    load_env_file(BACKEND_DIR / ".env")
    reader_mode = os.getenv("READER_MODE", "fixture").strip().lower()
    if reader_mode not in ("fixture", "live"):
        raise ValueError(f"READER_MODE must be 'fixture' or 'live', not {reader_mode!r}")
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL", "").rstrip("/"),
        supabase_secret_key=os.getenv("SUPABASE_SECRET_KEY", ""),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        reader_mode=reader_mode,
        allowed_origins=tuple(o.strip().rstrip("/") for o in origins.split(",") if o.strip()),
        tesseract_cmd=os.getenv("TESSERACT_CMD", ""),
        demo_password=os.getenv("DEMO_PASSWORD", ""),
        groq_api_key=os.getenv("GROQ_API_KEY", ""),
        groq_model=os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
    )
