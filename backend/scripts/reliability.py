"""The reliability report: every test poster through the live reader, several times, scored check by
check against the problems planted on it (test-posters/manifest.json).

    cd backend
    python -m scripts.reliability                       # every poster once, ten of them three times, live
    python -m scripts.reliability --runs 3 --repeat ""  # three runs of every poster
    python -m scripts.reliability --only 01-clean,06-wrong-fee
    python -m scripts.reliability --fixture --second-reader perfect   # the perfect reader: should score 100%
    python -m scripts.reliability --rescore             # check the saved readings again: no AI calls

Writes frontend/public/reliability.json and a small picture of each poster. Every run is saved to
backend/.cache/reliability-runs.json as it finishes, so a run stopped by a quota error carries on
where it stopped, and the run stops after a few refusals in a row from the free quota. Dates are checked
as of 7 Nov 2026, the day the posters were made for.
"""

import argparse
import json
import time
from collections import Counter
from dataclasses import replace
from datetime import datetime
from pathlib import Path

from PIL import Image

from app.config import BACKEND_DIR, REPO_DIR, get_settings
from app.models import PosterReading
from pipeline import ocr, reader
from pipeline.run import IST, PosterInput, Reference, check_poster, default_digit_reader
from rules.registry import load_rule_pack
from rules.text import digits
from tests.builders import BRAND_KIT, BRANCH, COURSES, NORTHFIELD_WORDS, STATS, TODAY, TOPPERS, topper_id

POSTERS = REPO_DIR / "test-posters"
OUT = REPO_DIR / "frontend" / "public"
CACHE = BACKEND_DIR / ".cache" / "reliability-runs.json"
THUMB_WIDTH = 240
# Read three times to see whether the answer stays the same: clean posters, guarantees in English and
# Hindi, a rank, consent, a fee, a disguised guarantee and a date.
REPEATED = ["01-clean", "12-clean-ananya", "18-clean-hindi", "02-banned-claim", "22-banned-hindi", "03-wrong-rank",
            "04-no-consent", "06-wrong-fee", "43-selection-pakka", "46-passed-deadline"]


def reference() -> Reference:
    logo = Image.open(BACKEND_DIR / "assets" / "northfield-logo.png").convert("RGB")
    return Reference(brand_kit=BRAND_KIT, courses=COURSES, result_stats=STATS, toppers=TOPPERS, branch=BRANCH,
                     logo=logo, words=NORTHFIELD_WORDS)


def perfect_digits(name: str) -> ocr.DigitReader:
    by_box = {tuple(n.box_2d): digits(n.raw_text) for n in reader.read_fixture(name).reading.numbers}
    return lambda image, box: by_box.get(tuple(box))


def run_one(entry: dict, ref: Reference, settings, second: str, saved: dict | None = None) -> dict:
    data = (POSTERS / entry["file"]).read_bytes()
    poster = PosterInput(image=data, mime_type="image/png", channel=entry["channel"], caption=entry["caption"],
                         alt_text=entry["alt_text"], tagged_topper_ids=[topper_id(n) for n in entry["tags"]],
                         filename=entry["file"])
    digit_reader = {"perfect": lambda: perfect_digits(entry["name"]), "off": lambda: None,
                    "tesseract": lambda: default_digit_reader(settings)}[second]()
    started = time.monotonic()
    cached = (PosterReading.model_validate(saved["reading"]), saved["reader_model"]) if saved and saved.get("reading") else None
    result = check_poster(poster, ref, settings, cached=cached, digit_reader=digit_reader, today=TODAY)
    return {
        "failed": sorted({f.rule_id for f in result.findings if f.severity != "pass"}),
        "asked": sum(f.severity == "needs_human" for f in result.findings),
        "findings": [{"rule_id": f.rule_id, "severity": f.severity, "message": f.message}
                     for f in result.findings if f.severity != "pass"],
        "reader_model": result.reader_model,
        "reading": result.reading.model_dump(mode="json") if result.reading else None,
        "seconds": saved["seconds"] if cached else round(time.monotonic() - started, 1),
        "at": saved["at"] if cached else datetime.now(IST).isoformat(timespec="seconds"),
    }


def planned_runs(name: str, runs: int, repeated: list[str], repeat_runs: int) -> int:
    return max(runs, repeat_runs) if name in repeated else runs


def read_ok(run: dict) -> bool:
    return "READ-01" not in run["failed"]


def score(manifest: list[dict], runs: dict, planned, meta: dict) -> dict:
    pack = load_rule_pack()
    rules = {r.id: r for r in pack.rules}
    checks = {rid: {"id": rid, "name": r.name, "kind": r.kind, "planted": 0, "caught": 0, "missed": 0,
                    "false_flags": 0, "clean_runs": 0, "consistent": 0, "compared": 0} for rid, r in rules.items()}
    posters, readers, unread = [], Counter(), 0
    for entry in manifest:
        mine = [r for key, r in sorted(runs.items()) if key.split("#")[0] == entry["name"]]
        read = [r for r in mine if read_ok(r)][: planned(entry["name"])]
        unread += sum(not read_ok(r) for r in mine)
        expect, also = set(entry["expect"]), set(entry.get("also", []))
        for r in read:
            model = r["reader_model"] or "none"
            readers["fixture" if model.startswith("fixture:") else model] += 1
        for rid, check in checks.items():
            if rid in expect:
                check["planted"] += 1
            verdicts = [rid in r["failed"] for r in read]
            for failed in verdicts:
                if rid in expect:
                    check["caught" if failed else "missed"] += 1
                elif rid not in also:
                    check["clean_runs"] += 1
                    check["false_flags"] += failed
            if len(verdicts) >= 2:
                check["compared"] += 1
                check["consistent"] += len(set(verdicts)) == 1
        scored = lambda r: {rid for rid in r["failed"] if rid in rules}  # noqa: E731
        outcomes = []
        for r in read:
            got = scored(r)
            outcomes.append({"failed": r["failed"], "reader_model": r["reader_model"], "asked": r["asked"],
                             "missed": sorted((expect & rules.keys()) - got), "extra": sorted(got - expect - also),
                             "findings": r["findings"]})
        posters.append({
            "name": entry["name"], "title": entry["title"], "channel": entry["channel"], "plants": entry["plants"],
            "planned": planned(entry["name"]),
            "expect": entry["expect"], "also": entry.get("also", []), "image": f"reliability/{entry['name']}.jpg",
            "runs": outcomes, "unread": len(mine) - len(read),
            "consistent": len({tuple(scored(r)) for r in read}) <= 1 if read else None,
        })
    caught = sum(c["caught"] for c in checks.values())
    missed = sum(c["missed"] for c in checks.values())
    false_flags = sum(c["false_flags"] for c in checks.values())
    clean_runs = sum(c["clean_runs"] for c in checks.values())
    all_runs = [o for p in posters for o in p["runs"]]
    compared = [p for p in posters if len(p["runs"]) >= 2]
    return {
        **meta,
        "posters": len(manifest), "runs": len(all_runs), "unread_runs": unread,
        "planned_runs": sum(planned(e["name"]) for e in manifest),
        "readers": dict(readers.most_common()),
        "summary": {
            "catch_rate": round(caught / (caught + missed), 4) if caught + missed else None,
            "caught": caught, "missed": missed,
            "false_flags": false_flags, "false_flag_rate": round(false_flags / clean_runs, 4) if clean_runs else None,
            "exactly_right": sum(not o["missed"] and not o["extra"] for o in all_runs),
            "consistent_posters": sum(p["consistent"] for p in compared), "compared_posters": len(compared),
            "asked_per_run": round(sum(o["asked"] for o in all_runs) / len(all_runs), 2) if all_runs else None,
        },
        "checks": sorted(checks.values(), key=lambda c: c["id"]),
        "results": posters,
    }


def thumbnails(manifest: list[dict]) -> None:
    folder = OUT / "reliability"
    folder.mkdir(parents=True, exist_ok=True)
    for entry in manifest:
        image = Image.open(POSTERS / entry["file"]).convert("RGB")
        image.thumbnail((THUMB_WIDTH, THUMB_WIDTH * 2))
        image.save(folder / f"{entry['name']}.jpg", "JPEG", quality=80, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--runs", type=int, default=1, help="runs of every poster")
    parser.add_argument("--repeat", default=",".join(REPEATED), help="posters read --repeat-runs times (comma-separated)")
    parser.add_argument("--repeat-runs", type=int, default=3)
    parser.add_argument("--stop-after", type=int, default=5, help="stop after this many quota refusals in a row")
    parser.add_argument("--only", default="", help="comma-separated poster names")
    parser.add_argument("--fixture", action="store_true", help="use the perfect fixture reader instead of the live one")
    parser.add_argument("--second-reader", choices=["tesseract", "perfect", "off"], default="tesseract")
    parser.add_argument("--pause", type=float, default=3.0, help="seconds between live reads, for the free quota")
    parser.add_argument("--fresh", action="store_true", help="forget saved runs and start again")
    parser.add_argument("--rescore", action="store_true", help="re-check the saved readings without calling the AI")
    args = parser.parse_args()

    settings = replace(get_settings(), reader_mode="fixture" if args.fixture else "live")
    second = args.second_reader
    if second == "tesseract" and default_digit_reader(settings) is None:
        print("Tesseract isn't installed here, so the second read is off. Install it, or pass --second-reader off.")
        second = "off"
    manifest = json.loads((POSTERS / "manifest.json").read_text(encoding="utf-8"))
    chosen = [e for e in manifest if not args.only or e["name"] in args.only.split(",")]
    mode = "fixture" if args.fixture else "live"
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    saved = {} if args.fresh or not CACHE.exists() else json.loads(CACHE.read_text(encoding="utf-8"))
    runs = saved.get(mode, {})
    ref = reference()
    repeated = [name for name in args.repeat.split(",") if name]
    planned = lambda name: planned_runs(name, args.runs, repeated, args.repeat_runs)  # noqa: E731
    if args.rescore:
        runs = {key: run_one(next(e for e in manifest if e["name"] == key.split("#")[0]), ref, settings, second, run)
                for key, run in runs.items() if run.get("reading")}
        saved[mode] = runs
        CACHE.write_text(json.dumps(saved, indent=1, ensure_ascii=False), encoding="utf-8")
    refused = 0
    for i in range(0 if args.rescore else max(args.runs, args.repeat_runs if repeated else 0)):
        for entry in chosen:
            done = sum(read_ok(r) for key, r in runs.items() if key.split("#")[0] == entry["name"])
            if done >= planned(entry["name"]) or i >= planned(entry["name"]):
                continue
            key = next(f"{entry['name']}#{n}" for n in range(10) if f"{entry['name']}#{n}" not in runs or not read_ok(runs[f"{entry['name']}#{n}"]))
            runs[key] = run_one(entry, ref, settings, second)
            saved[mode] = runs
            CACHE.write_text(json.dumps(saved, indent=1, ensure_ascii=False), encoding="utf-8")
            r = runs[key]
            print(f"{key}: {r['failed'] or 'all pass'} ({r['reader_model']}, {r['seconds']}s)", flush=True)
            refused = 0 if read_ok(r) else refused + 1
            if refused >= args.stop_after:
                print(f"Stopped: {refused} reads in a row were refused, so the free quota is out. Run again later.")
                break
            if not args.fixture:
                time.sleep(args.pause)
        if refused >= args.stop_after:
            break

    meta = {
        "generated_at": datetime.now(IST).isoformat(timespec="seconds"), "mode": mode, "second_reader": second,
        "checked_as_of": TODAY.isoformat(), "gemini_model": settings.gemini_model, "groq_model": settings.groq_model,
        "prompt_version": reader.PROMPT_VERSION,
    }
    meta.update({"runs_per_poster": args.runs, "repeated": repeated, "repeat_runs": args.repeat_runs})
    report = score(manifest, runs, planned, meta)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "reliability.json").write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    thumbnails(manifest)
    s = report["summary"]
    print(f"\n{report['runs']} of {report['planned_runs']} runs · catch rate {s['catch_rate']} · false flags {s['false_flags']} "
          f"({s['false_flag_rate']}) · consistent {s['consistent_posters']}/{s['compared_posters']} · readers {report['readers']}")


if __name__ == "__main__":
    main()
