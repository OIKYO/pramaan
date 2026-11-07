"""Read a poster: one Gemini call per poster version, returning a validated PosterReading.

- Gemini gets the image and the caption, a JSON response schema and temperature 0.
- Invalid output is retried up to 2 times. If Gemini itself fails (quota, outage), the backup
  reader on Groq gets the same prompt. If everything fails, ReaderError is raised and the
  pipeline records a READ-01 finding for a person, instead of crashing.
- READER_MODE=fixture loads tests/fixtures/readings/<name>.json instead: no AI calls.
"""

import base64
import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path

import httpx
from pydantic import ValidationError

from app.config import BACKEND_DIR, Settings
from app.models import BrandKit, PosterReading

log = logging.getLogger(__name__)

FIXTURES_DIR = BACKEND_DIR / "tests" / "fixtures" / "readings"
AI_RULE_IDS = ("BRAND-04", "AI-01")
PROMPT_VERSION = "2026-11-08b"
MAX_ATTEMPTS = 3  # the first try plus 2 retries
TEMPORARY = ("503", "UNAVAILABLE")  # the service says "try again later"
SERVICE_RETRY_SECONDS = 3


class ReaderError(Exception):
    """No reader could produce a valid reading."""


@dataclass
class ReadResult:
    reading: PosterReading
    model: str
    attempts: int
    errors: list[str] = field(default_factory=list)


def build_prompt(brand_kit: BrandKit, caption: str, about: str = "", person: str = "people") -> str:
    kind = f" ({about})" if about else ""
    return f"""You read advertising posters for {brand_kit.registered_name}{kind} so that plain code can check them.

Report only what is visibly printed on the poster image. Never guess, infer or fill in anything that isn't printed. If something isn't visible, leave the field empty.

Fill in:
- text_blocks: every separate line of text, verbatim (keep spelling, symbols, capitals and numbers exactly). For Hindi or Bengali text, also give a Latin-script transliteration in `romanised`.
- claims: promotional statements about results, selections, ranks, success rates or jobs.
- people: every person shown or named on the poster (for this organisation, usually {person}). Give the name as printed (and romanised_name if it isn't in Latin script), rank_text exactly as printed and rank_value as a number, and the course name, duration and paid/free wording printed next to that person. Leave a field empty if it isn't printed next to them.
- numbers: every rank, fee, phone number and results figure. kind is one of rank, fee, phone, stat, other. raw_text exactly as printed. value as a number (fees in rupees); leave value empty for phone numbers. The box should cover just the number.
- other_brands: the name or logo of any other organisation shown, such as a partner, sponsor, university or company. Not exam names, and not {brand_kit.registered_name} itself. Give the name and a box.
- registered_name_seen: true only if "{brand_kit.registered_name}" is printed.
- helpline_seen: true only if the helpline {brand_kit.helpline} is printed.
- wording_flags: wording that breaks one of these two rules. Use ONLY these rule ids:
  - AI-01: a disguised guarantee, i.e. promising selection, a rank or a seat without using the word "guarantee" (for example "selection pakka", "seat confirmed"), in any language.
  - BRAND-04: tone of voice, judged against these notes: {brand_kit.tone_notes}
  For each flag give the exact text, rule_id, why (one sentence) and, if you can, a suggested_rewrite.
  Also check the caption below. For wording in the caption, use box_2d [0, 0, 0, 0].

Every box_2d is [ymin, xmin, ymax, xmax], scaled 0-1000.

Caption to be posted with the image: {json.dumps(caption or "")}

Return JSON only."""


def read_fixture(name: str) -> ReadResult:
    path = FIXTURES_DIR / f"{name}.json"
    if not path.exists():
        raise ReaderError(f"READER_MODE=fixture but there's no fixture reading {path.name}.")
    return ReadResult(PosterReading.model_validate_json(path.read_text(encoding="utf-8")), f"fixture:{name}", 0)


def fixture_name_for(sha256: str, filename: str) -> str:
    """Fixtures are found by the image's hash (tools/make_test_posters.py writes index.json),
    falling back to the uploaded file's name."""
    index_path = FIXTURES_DIR / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        if sha256 in index:
            return index[sha256]
    return Path(filename).stem


def _gemini(image: bytes, mime_type: str, prompt: str, settings: Settings) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[types.Part.from_bytes(data=image, mime_type=mime_type), prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=PosterReading.model_json_schema(),
            temperature=0,
        ),
    )
    return response.text or ""


def _groq(image: bytes, mime_type: str, prompt: str, settings: Settings) -> str:
    """Backup reader: an OpenAI-compatible vision model on Groq, with JSON output."""
    schema = json.dumps(PosterReading.model_json_schema())
    image_url = f"data:{mime_type};base64,{base64.b64encode(image).decode()}"
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.groq_api_key}"},
        json={
            "model": settings.groq_model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": f"{prompt}\n\nThe JSON must follow this JSON Schema:\n{schema}"},
                {"type": "image_url", "image_url": {"url": image_url}},
            ]}],
        },
        timeout=120,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def _try(name: str, call, errors: list[str], wait=time.sleep) -> tuple[PosterReading | None, int]:
    """Up to MAX_ATTEMPTS calls. Invalid output is retried. A failing service is retried once, after a
    short wait, only if it said the failure is temporary (503); otherwise the next reader takes over."""
    retried_service = False
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            raw = call()
        except Exception as exc:
            errors.append(f"{name}: {type(exc).__name__}: {str(exc)[:200]}")
            if not retried_service and any(mark in str(exc) for mark in TEMPORARY):
                retried_service = True
                wait(SERVICE_RETRY_SECONDS)
                continue
            return None, attempt
        try:
            return PosterReading.model_validate_json(raw), attempt
        except ValidationError as exc:
            errors.append(f"{name} attempt {attempt}: invalid output ({exc.error_count()} errors)")
    return None, MAX_ATTEMPTS


def read_live(image: bytes, mime_type: str, brand_kit: BrandKit, caption: str, settings: Settings, *,
              about: str = "", person: str = "people") -> ReadResult:
    prompt = build_prompt(brand_kit, caption, about, person)
    errors: list[str] = []
    readers = []
    if settings.gemini_api_key:
        readers.append((settings.gemini_model, lambda: _gemini(image, mime_type, prompt, settings)))
    if settings.groq_api_key:
        readers.append((f"groq:{settings.groq_model}", lambda: _groq(image, mime_type, prompt, settings)))
    total = 0
    for name, call in readers:
        reading, attempts = _try(name, call, errors)
        total += attempts
        if reading is not None:
            return ReadResult(reading, name, total, errors)
        log.warning("Reader %s failed: %s", name, errors[-1] if errors else "")
    raise ReaderError("; ".join(errors) or "No reader is configured (set GEMINI_API_KEY).")
