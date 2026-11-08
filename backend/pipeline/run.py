"""check_poster() is pure (read -> second read -> match names -> visual checks -> rules), so tests
run it without a database. load_reference(), cached_reading() and save_result() are the database side."""

import hashlib
import io
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache

from PIL import Image, ImageOps

from app.config import Settings
from app.models import BrandKit, Branch, Course, Finding, PosterReading, ResultStat, Topper
from pipeline import ocr, reader, visual
from pipeline.match import identity_findings, match_people
from rules.registry import Problem, RuleContext, Words, rule_def, run_rules, to_finding

log = logging.getLogger(__name__)
IST = timezone(timedelta(hours=5, minutes=30))


@dataclass
class PosterInput:
    image: bytes
    mime_type: str
    channel: str
    caption: str = ""
    alt_text: str = ""
    tagged_topper_ids: list[str] = field(default_factory=list)
    filename: str = ""


@dataclass
class Reference:
    """`rulebooks` is None in tests that want every check."""

    brand_kit: BrandKit
    courses: list[Course]
    result_stats: list[ResultStat]
    toppers: dict[str, Topper]
    branch: Branch
    logo: Image.Image | None = None
    enabled: dict[str, bool] = field(default_factory=dict)
    rulebooks: set[str] | None = None
    words: Words = field(default_factory=Words)
    about: str = ""  # what the organisation does, for the AI reader, e.g. "Coaching Institutes"
    industry: str = ""  # the industry group's name
    restricted: list[str] = field(default_factory=list)  # claims its ads may never make (LEGAL-02)

    def keeps(self, rulebook: str) -> bool:
        return self.rulebooks is None or rulebook in self.rulebooks


@dataclass
class CheckResult:
    sha256: str
    reading: PosterReading | None
    reader_model: str | None
    findings: list[Finding]
    ai_call: dict | None = None  # what was sent to an AI, for the audit log


def image_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_image(data: bytes) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")


def default_digit_reader(settings: Settings) -> ocr.DigitReader | None:
    return ocr.tesseract_digits if ocr.tesseract_available(settings.tesseract_cmd) else None


def _passed(rule_id: str, message: str) -> Finding:
    return Finding(rule_id=rule_id, kind="reader", severity="pass", message=message, reason=rule_def(rule_id).reason)


def check_poster(
    poster: PosterInput,
    ref: Reference,
    settings: Settings,
    *,
    cached: tuple[PosterReading, str] | None = None,
    digit_reader: ocr.DigitReader | None | str = "auto",
    today: date | None = None,
) -> CheckResult:
    sha = image_sha256(poster.image)
    image = load_image(poster.image)
    today = today or datetime.now(IST).date()

    ai_call = None
    if cached:
        reading, model = cached
        read_note = f"Reused the reading of an identical image ({model})."
    else:
        live = settings.reader_mode == "live"
        try:
            if live:
                result = reader.read_live(poster.image, poster.mime_type, ref.brand_kit, poster.caption, settings,
                                          about=ref.about, person=ref.words.person_plural)
            else:
                result = reader.read_fixture(reader.fixture_name_for(sha, poster.filename))
        except reader.ReaderError as exc:
            log.warning("Reader failed for %s: %s", sha[:12], exc)
            failed = to_finding("READ-01", Problem(
                "The poster couldn't be read, so none of the checks ran.", {"error": str(exc)[:500]},
                "Try again in a minute. If it keeps failing, a reviewer must check the poster by eye.",
            ))
            call = _ai_call(settings, sha, poster, attempts=None, error=str(exc)) if live else None
            return CheckResult(sha, None, None, [failed], call)
        reading, model = result.reading, result.model
        read_note = f"Read by {model}."
        if live:
            ai_call = _ai_call(settings, sha, poster, attempts=result.attempts, model=model, error="; ".join(result.errors))

    if digit_reader == "auto":
        digit_reader = default_digit_reader(settings)
    findings = ocr.cross_check(image, reading, digit_reader)

    matches = []
    if ref.keeps("people"):
        matches = match_people(reading, list(ref.toppers.values()))
        findings += identity_findings(reading, matches, poster.tagged_topper_ids, ref.toppers)

    report = visual.analyse(image, reading, ref.brand_kit.palette, ref.logo)

    # Data from a rulebook the organisation doesn't keep is left out, so no check leans on it.
    ctx = RuleContext(
        reading=reading, people=matches, tagged_topper_ids=poster.tagged_topper_ids, brand_kit=ref.brand_kit,
        courses=ref.courses if ref.keeps("offerings") else [],
        result_stats=ref.result_stats if ref.keeps("figures") else [],
        toppers=ref.toppers if ref.keeps("people") else {}, branch=ref.branch,
        channel=poster.channel, caption=poster.caption, alt_text=poster.alt_text, visual=report, today=today,
        words=ref.words, industry=ref.industry, restricted=ref.restricted,
    )
    findings = [_passed("READ-01", read_note), *findings, *run_rules(ctx, ref.enabled, ref.rulebooks)]
    return CheckResult(sha, reading, model, findings, ai_call)


def _ai_call(settings: Settings, sha: str, poster: PosterInput, *, attempts, model=None, error="") -> dict:
    return {
        "model": model or settings.gemini_model,
        "image_sha256": sha,
        "sent": {"image": f"poster image ({poster.mime_type})", "caption": poster.caption,
                 "prompt_version": reader.PROMPT_VERSION},
        "attempts": attempts,
        "error": error or None,
        "at": datetime.now(IST).isoformat(),
    }


@lru_cache
def _logo(db_url: str, path: str) -> Image.Image | None:
    from app.db import get_db

    try:
        return Image.open(io.BytesIO(get_db().storage.from_("brand").download(path))).convert("RGB")
    except Exception:
        log.exception("Couldn't load the brand logo %s", path)
        return None


def load_reference(db, branch_id: str, org_id: str) -> Reference:
    from app.catalog import complete, restricted_claims, words

    org = db.table("organisations").select("industry_group, industry, rulebooks").eq("id", org_id).single().execute().data
    brand = db.table("brand_kit").select("*").eq("org_id", org_id).single().execute().data
    toppers = db.table("toppers").select("*").eq("org_id", org_id).execute().data
    branch = db.table("branches").select("*").eq("id", branch_id).eq("org_id", org_id).single().execute().data
    settings_rows = db.table("rule_settings").select("rule_id, enabled").eq("org_id", org_id).execute().data
    return Reference(
        brand_kit=BrandKit(**brand),
        courses=[Course(**c) for c in db.table("courses").select("*").eq("org_id", org_id).execute().data],
        result_stats=[ResultStat(**s) for s in db.table("result_stats").select("*").eq("org_id", org_id).execute().data],
        toppers={t["id"]: Topper(**t) for t in toppers},
        branch=Branch(**branch),
        logo=_logo(str(db.supabase_url), brand["logo_path"]) if brand.get("logo_path") else None,
        enabled={r["rule_id"]: r["enabled"] for r in settings_rows},
        rulebooks=set(complete(org.get("rulebooks") or [])),
        words=words(org.get("industry_group"), org.get("industry")),
        about=org.get("industry") or "",
        industry=restricted_claims(org.get("industry_group"))[0],
        restricted=restricted_claims(org.get("industry_group"))[1],
    )


def cached_reading(db, sha: str, caption: str, live: bool, org_id: str) -> tuple[PosterReading, str] | None:
    """So the same poster isn't sent to the AI twice."""
    rows = (db.table("poster_versions").select("reading, reader_model, posters!inner(org_id)")
            .eq("posters.org_id", org_id)
            .eq("image_sha256", sha).eq("caption", caption).not_.is_("reading", "null")
            .order("created_at", desc=True).limit(5).execute().data)
    for row in rows:
        is_fixture = (row["reader_model"] or "").startswith("fixture:")
        if is_fixture != live:
            return PosterReading.model_validate(row["reading"]), row["reader_model"]
    return None


def save_result(db, version_id: str, result: CheckResult, actor_id: str | None, org_id: str) -> None:
    db.table("findings").delete().eq("version_id", version_id).execute()
    db.table("poster_versions").update({
        "reading": result.reading.model_dump(mode="json") if result.reading else None,
        "reader_model": result.reader_model,
        "checked_at": datetime.now(IST).isoformat(),
    }).eq("id", version_id).execute()
    rows = [{**f.model_dump(mode="json"), "version_id": version_id} for f in result.findings]
    if rows:
        db.table("findings").insert(rows).execute()
    if result.ai_call:
        db.table("audit_log").insert({
            "org_id": org_id, "actor_id": actor_id, "action": "ai_call", "target_type": "poster_version",
            "target_id": version_id, "details": result.ai_call,
        }).execute()
