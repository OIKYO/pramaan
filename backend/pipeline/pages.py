"""Posts with more than one page: a carousel of images, or a PDF brochure.

Each page is read and checked on its own, then the pages are stacked into one reading so every rule
runs once over the whole post. In a stacked box_2d, page n (from 0) covers y from 1000*n to
1000*(n+1); x stays 0-1000. A single-page poster is page 0, so its boxes don't change.
"""

import io

import pypdfium2 as pdfium
from PIL import Image

from app.models import Finding, PosterReading, VisualReport

PAGE_SPAN = 1000
MAX_PAGES = 10
PDF_WIDTH = 1600


def stack_box(box: list[int] | None, page: int) -> list[int] | None:
    if not box:
        return box
    ymin, xmin, ymax, xmax = box
    return [ymin + page * PAGE_SPAN, xmin, ymax + page * PAGE_SPAN, xmax]


def unstack_box(box: list[int]) -> tuple[int, list[int]]:
    page = min(box[0] // PAGE_SPAN, MAX_PAGES - 1)
    ymin, xmin, ymax, xmax = box
    return page, [ymin - page * PAGE_SPAN, xmin, min(ymax - page * PAGE_SPAN, PAGE_SPAN), xmax]


def within_page(reading: PosterReading) -> PosterReading:
    """A reader's boxes clamped to one page, before stacking."""
    data = reading.model_dump()
    for items in data.values():
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict) and item.get("box_2d"):
                    item["box_2d"] = [min(max(v, 0), PAGE_SPAN) for v in item["box_2d"]]
    return PosterReading.model_validate(data)


def stack_reading(reading: PosterReading, page: int) -> PosterReading:
    data = reading.model_dump()
    for items in data.values():
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict) and item.get("box_2d"):
                    item["box_2d"] = stack_box(item["box_2d"], page)
    return PosterReading.model_validate(data)


def merge_readings(readings: list[PosterReading | None]) -> PosterReading:
    merged = PosterReading()
    for page, reading in enumerate(readings):
        if reading is None:
            continue
        stacked = stack_reading(reading, page)
        merged.text_blocks += stacked.text_blocks
        merged.claims += stacked.claims
        merged.people += stacked.people
        merged.numbers += stacked.numbers
        merged.wording_flags += stacked.wording_flags
        merged.other_brands += stacked.other_brands
        merged.registered_name_seen |= stacked.registered_name_seen
        merged.helpline_seen |= stacked.helpline_seen
    return merged


def stack_findings(findings: list[Finding], page: int) -> list[Finding]:
    if page == 0:
        return findings
    out = []
    for finding in findings:
        box = (finding.evidence or {}).get("box_2d")
        out.append(finding.model_copy(update={"evidence": {**finding.evidence, "box_2d": stack_box(box, page)}}) if box else finding)
    return out


def merge_visual(reports: list[VisualReport | None], readings: list[PosterReading | None]) -> VisualReport | None:
    """One report for the post: every page's colours, the best logo match, and contrast numbered
    by the stacked reading's text blocks."""
    present = [r for r in reports if r is not None]
    if not present:
        return None
    merged = VisualReport(width=present[0].width, height=present[0].height)
    offset = 0
    for report, reading in zip(reports, readings):
        if reading is None:
            continue
        if report is not None:
            merged.palette += report.palette
            if report.logo_score is not None:
                merged.logo_score = max(merged.logo_score or 0.0, report.logo_score)
            merged.contrast += [c.model_copy(update={"block_index": c.block_index + offset}) for c in report.contrast]
        offset += len(reading.text_blocks)
    return merged


def render_pdf(data: bytes, max_pages: int = MAX_PAGES) -> list[bytes]:
    """Each page as a PNG, PDF_WIDTH pixels wide. Refuses more than max_pages."""
    pdf = pdfium.PdfDocument(data)
    try:
        if len(pdf) > max_pages:
            raise ValueError(f"The PDF has {len(pdf)} pages; Pramaan checks up to {max_pages}. Split it and upload each part.")
        pngs = []
        for index in range(len(pdf)):
            page = pdf[index]
            width, _ = page.get_size()
            image: Image.Image = page.render(scale=PDF_WIDTH / width).to_pil().convert("RGB")
            buffer = io.BytesIO()
            image.save(buffer, "PNG", optimize=True)
            pngs.append(buffer.getvalue())
        return pngs
    finally:
        pdf.close()
