import hashlib
import io

import pytest
from PIL import Image

from app.models import ContrastReading, PosterReading, VisualReport
from pipeline import pages, reader
from pipeline.run import Page, PosterInput, check_poster, load_image
from rules.text import digits
from tests.builders import TODAY, clean_reading, topper_id
from tests.test_pipeline import MANIFEST, POSTERS, REFERENCE, SETTINGS

ENTRY = {e["name"]: e for e in MANIFEST}


def test_stacked_boxes_say_which_page_they_are_on():
    box = [100, 200, 300, 400]
    assert pages.stack_box(box, 0) == box
    assert pages.stack_box(box, 2) == [2100, 200, 2300, 400]
    assert pages.unstack_box([2100, 200, 2300, 400]) == (2, box)
    assert pages.unstack_box([900, 0, 1000, 50]) == (0, [900, 0, 1000, 50])


def test_merging_stacks_each_page_and_keeps_what_any_page_shows():
    first, second = clean_reading(), clean_reading().model_copy(update={"registered_name_seen": False})
    merged = pages.merge_readings([first, second])
    assert len(merged.text_blocks) == 2 * len(first.text_blocks)
    n = len(first.text_blocks)
    assert merged.text_blocks[n].box_2d[0] == first.text_blocks[0].box_2d[0] + 1000
    assert merged.registered_name_seen and merged.people[-1].box_2d[0] >= 1000
    assert pages.merge_readings([first]) == first
    assert pages.merge_readings([None, first]).text_blocks[0].box_2d[0] >= 1000


def test_a_reader_box_is_kept_inside_its_page():
    wild = PosterReading.model_validate({"text_blocks": [{"text": "x", "box_2d": [900, 10, 4000, 20]}]})
    assert pages.within_page(wild).text_blocks[0].box_2d == [900, 10, 1000, 20]


def test_visual_reports_merge_with_text_blocks_renumbered():
    reading = PosterReading.model_validate({"text_blocks": [{"text": "a", "box_2d": [0, 0, 10, 10]},
                                                            {"text": "b", "box_2d": [20, 0, 30, 10]}]})
    one = VisualReport(width=10, height=10, logo_score=0.4, contrast=[ContrastReading(block_index=1, ratio=3.0, fg="#000000", bg="#111111")])
    two = VisualReport(width=10, height=10, logo_score=0.9, contrast=[ContrastReading(block_index=0, ratio=2.0, fg="#000000", bg="#111111")])
    merged = pages.merge_visual([one, two], [reading, reading])
    assert merged.logo_score == 0.9
    assert [c.block_index for c in merged.contrast] == [1, 2]
    assert pages.merge_visual([None], [None]) is None


def test_a_pdf_becomes_one_image_per_page():
    posters = [Image.open(POSTERS / ENTRY[n]["file"]).convert("RGB") for n in ("01-clean", "06-wrong-fee")]
    buffer = io.BytesIO()
    posters[0].save(buffer, "PDF", save_all=True, append_images=posters[1:])
    rendered = pages.render_pdf(buffer.getvalue())
    assert len(rendered) == 2
    assert all(Image.open(io.BytesIO(png)).width == pages.PDF_WIDTH for png in rendered)
    with pytest.raises(ValueError, match="checks up to 1"):
        pages.render_pdf(buffer.getvalue(), max_pages=1)


def test_a_carousel_is_checked_as_one_post_with_findings_on_their_page():
    names = ["01-clean", "06-wrong-fee"]
    data = [(POSTERS / ENTRY[n]["file"]).read_bytes() for n in names]
    readings = {hashlib.sha256(load_image(d).tobytes()).hexdigest(): reader.read_fixture(n).reading
                for d, n in zip(data, names)}

    def second_reader(image, box_2d):
        reading = readings[hashlib.sha256(image.tobytes()).hexdigest()]
        return next(digits(n.raw_text) for n in reading.numbers if n.box_2d == box_2d)

    first = ENTRY["01-clean"]
    post = PosterInput(image=data[0], mime_type="image/png", channel=first["channel"], caption=first["caption"],
                       alt_text=first["alt_text"], tagged_topper_ids=[topper_id(n) for n in first["tags"]],
                       filename=first["file"], more_pages=[Page(data[1], "image/png", ENTRY["06-wrong-fee"]["file"])])
    result = check_poster(post, REFERENCE, SETTINGS, digit_reader=second_reader, today=TODAY)
    failed = [f for f in result.findings if f.severity != "pass"]
    assert {f.rule_id for f in failed} == {"FACT-02"}, [f.message for f in failed]
    assert pages.unstack_box(failed[0].evidence["box_2d"])[0] == 1
    assert len(result.pages) == 2 and result.reader_model == "fixture:01-clean, fixture:06-wrong-fee"
    assert next(f for f in result.findings if f.rule_id == "READ-01").message.startswith("All 2 pages read")
