"""check_poster() is pure (read -> second read -> match names -> visual checks -> rules), so tests
run it without a database. load_reference(), cached_reading() and save_result() are the database side."""

import hashlib
import io
import json
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache

from PIL import Image, ImageOps

from app.config import Settings
from app.models import BrandKit, Branch, Course, Finding, PosterReading, ResultStat, Topper
from pipeline import ocr, pages, reader, visual
from pipeline.match import identity_findings, match_people
from rules.registry import Problem, RuleContext, Words, rule_def, run_rules, to_finding

log = logging.getLogger(__name__)
IST = timezone(timedelta(hours=5, minutes=30))


@dataclass
class Page:
    image: bytes
    mime_type: str
    filename: str = ""


@dataclass
class PosterInput:
    image: bytes
    mime_type: str
    channel: str
    caption: str = ""
    alt_text: str = ""
    tagged_topper_ids: list[str] = field(default_factory=list)
    filename: str = ""
    more_pages: list[Page] = field(default_factory=list)

    @property
    def pages(self) -> list[Page]:
        return [Page(self.image, self.mime_type, self.filename), *self.more_pages]


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
class PageResult:
    sha256: str
    reading: PosterReading | None
    reader_model: str | None


@dataclass
class CheckResult:
    sha256: str
    reading: PosterReading | None
    reader_model: str | None
    findings: list[Finding]
    ai_calls: list[dict] = field(default_factory=list)  # what was sent to an AI, for the audit log
    pages: list[PageResult] = field(default_factory=list)


def image_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_image(data: bytes) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")


def default_digit_reader(settings: Settings) -> ocr.DigitReader | None:
    return ocr.tesseract_digits if ocr.tesseract_available(settings.tesseract_cmd) else None


def _passed(rule_id: str, message: str) -> Finding:
    return Finding(rule_id=rule_id, kind="reader", severity="pass", message=message, reason=rule_def(rule_id).reason)


def post_sha256(page_shas: list[str]) -> str:
    return page_shas[0] if len(page_shas) == 1 else hashlib.sha256("".join(page_shas).encode()).hexdigest()


def _read_page(page: Page, sha: str, poster: PosterInput, ref: Reference, settings: Settings,
               cached: tuple[PosterReading, str] | None) -> tuple[PosterReading | None, str | None, str, dict | None]:
    """(reading, model, note or error, ai call)."""
    if cached:
        return cached[0], cached[1], f"Reused the reading of an identical image ({cached[1]}).", None
    live = settings.reader_mode == "live"
    try:
        if live:
            result = reader.read_live(page.image, page.mime_type, ref.brand_kit, poster.caption, settings,
                                      about=ref.about, person=ref.words.person_plural)
        else:
            result = reader.read_fixture(reader.fixture_name_for(sha, page.filename))
    except reader.ReaderError as exc:
        log.warning("Reader failed for %s: %s", sha[:12], exc)
        call = _ai_call(settings, sha, page, poster.caption, attempts=None, error=str(exc)) if live else None
        return None, None, str(exc), call
    call = (_ai_call(settings, sha, page, poster.caption, attempts=result.attempts, model=result.model,
                     error="; ".join(result.errors)) if live else None)
    return pages.within_page(result.reading), result.model, f"Read by {result.model}.", call


def check_poster(
    poster: PosterInput,
    ref: Reference,
    settings: Settings,
    *,
    cached: tuple[PosterReading, str] | None | list[tuple[PosterReading, str] | None] = None,
    digit_reader: ocr.DigitReader | None | str = "auto",
    today: date | None = None,
) -> CheckResult:
    today = today or datetime.now(IST).date()
    if digit_reader == "auto":
        digit_reader = default_digit_reader(settings)
    all_pages = poster.pages
    many = len(all_pages) > 1
    cached_pages = cached if isinstance(cached, list) else [cached] + [None] * (len(all_pages) - 1)

    results, readings, reports, findings, ai_calls, notes, failed = [], [], [], [], [], [], []
    for index, page in enumerate(all_pages):
        sha = image_sha256(page.image)
        reading, model, note, call = _read_page(page, sha, poster, ref, settings, cached_pages[index])
        if call:
            ai_calls.append(call)
        results.append(PageResult(sha, reading, model))
        readings.append(reading)
        if reading is None:
            failed.append((index, note))
            reports.append(None)
            continue
        notes.append(note)
        image = load_image(page.image)
        findings += pages.stack_findings(ocr.cross_check(image, reading, digit_reader), index)
        reports.append(visual.analyse(image, reading, ref.brand_kit.palette, ref.logo))

    sha = post_sha256([r.sha256 for r in results])
    models = sorted({r.reader_model for r in results if r.reader_model})
    model = ", ".join(models) or None
    unread = [to_finding("READ-01", Problem(
        f"Page {index + 1} couldn't be read, so its checks didn't run." if many
        else "The poster couldn't be read, so none of the checks ran.",
        {"error": error[:500], "page": index + 1},
        "Try again in a minute. If it keeps failing, a reviewer must check the poster by eye.",
    )) for index, error in failed]
    if len(failed) == len(all_pages):
        return CheckResult(sha, None, None, unread, ai_calls, results)

    reading = pages.merge_readings(readings)
    matches = []
    if ref.keeps("people"):
        matches = match_people(reading, list(ref.toppers.values()))
        findings += identity_findings(reading, matches, poster.tagged_topper_ids, ref.toppers)
    report = pages.merge_visual(reports, readings)

    # Data from a rulebook the organisation doesn't keep is left out, so no check leans on it.
    ctx = RuleContext(
        reading=reading, people=matches, tagged_topper_ids=poster.tagged_topper_ids, brand_kit=ref.brand_kit,
        courses=ref.courses if ref.keeps("offerings") else [],
        result_stats=ref.result_stats if ref.keeps("figures") else [],
        toppers=ref.toppers if ref.keeps("people") else {}, branch=ref.branch,
        channel=poster.channel, caption=poster.caption, alt_text=poster.alt_text, visual=report, today=today,
        words=ref.words, industry=ref.industry, restricted=ref.restricted,
    )
    read = unread or [_passed("READ-01", notes[0] if not many else f"All {len(all_pages)} pages read ({model}).")]
    return CheckResult(sha, reading, model, [*read, *findings, *run_rules(ctx, ref.enabled, ref.rulebooks)], ai_calls, results)


def _ai_call(settings: Settings, sha: str, page: Page, caption: str, *, attempts, model=None, error="") -> dict:
    return {
        "model": model or settings.gemini_model,
        "image_sha256": sha,
        "sent": {"image": f"poster image ({page.mime_type})", "caption": caption,
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
    """So the same page isn't sent to the AI twice: a single-page version by its image hash, or any
    page of a longer post by that page's hash."""
    def recent():
        return (db.table("poster_versions").select("reading, reader_model, image_sha256, pages, posters!inner(org_id)")
                .eq("posters.org_id", org_id).eq("caption", caption).order("created_at", desc=True).limit(5))

    rows = recent().eq("image_sha256", sha).not_.is_("reading", "null").execute().data
    rows += recent().filter("pages", "cs", json.dumps([{"image_sha256": sha}])).execute().data
    for row in rows:
        if row["image_sha256"] == sha and len(row.get("pages") or []) <= 1:
            found = (row["reading"], row["reader_model"])
        else:
            page = next((pg for pg in row.get("pages") or [] if pg.get("image_sha256") == sha and pg.get("reading")), None)
            found = (page["reading"], page["reader_model"]) if page else (None, None)
        if not found[0]:
            continue
        if (found[1] or "").startswith("fixture:") != live:
            return PosterReading.model_validate(found[0]), found[1]
    return None


def save_result(db, version_id: str, result: CheckResult, actor_id: str | None, org_id: str,
                page_paths: list[str] | None = None) -> None:
    db.table("findings").delete().eq("version_id", version_id).execute()
    update = {
        "reading": result.reading.model_dump(mode="json") if result.reading else None,
        "reader_model": result.reader_model,
        "checked_at": datetime.now(IST).isoformat(),
    }
    if page_paths:
        by_index = {i: r for i, r in enumerate(result.pages)}
        update["pages"] = [{
            "image_path": path,
            "image_sha256": by_index[i].sha256 if i in by_index else None,
            "reading": by_index[i].reading.model_dump(mode="json") if i in by_index and by_index[i].reading else None,
            "reader_model": by_index[i].reader_model if i in by_index else None,
        } for i, path in enumerate(page_paths)]
    db.table("poster_versions").update(update).eq("id", version_id).execute()
    rows = [{**f.model_dump(mode="json"), "version_id": version_id} for f in result.findings]
    if rows:
        db.table("findings").insert(rows).execute()
    for call in result.ai_calls:
        db.table("audit_log").insert({
            "org_id": org_id, "actor_id": actor_id, "action": "ai_call", "target_type": "poster_version",
            "target_id": version_id, "details": call,
        }).execute()
