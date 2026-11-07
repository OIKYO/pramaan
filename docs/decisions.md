# Decisions

Why Pramaan is built the way it is. Each entry: the decision, the reason, and what it costs. New entries go at the bottom of their section.

## Principles (from the project brief)

- **Code decides, AI reads.** Gemini only extracts text and flags wording. Every verdict on consent, ranks, fees and disclosures is plain Python, so the same poster always gets the same result, and every result can be explained line by line.
- **One Gemini call per poster version**, cached by the image's SHA-256, to stay inside free-tier rate limits.
- **Two readers for key numbers.** If Gemini and Tesseract disagree about a rank, fee, phone number or statistic, Pramaan asks a person instead of guessing.
- **Consent files never go to the AI.** Only the poster image and its caption are sent to Gemini.
- **No face recognition.** Branch staff tag the students shown; people nobody tagged go to a reviewer.

## Setup

- **Python 3.12 and `requirements.txt`, pinned to exact versions.** Matches the Render Docker image, so what passes locally is what runs in production.
- **Frontend `npm run check` = `tsc` + ESLint with page rules.** The linter enforces the frontend rules that can be automated: Motion is imported only in `lib/motion.ts` and `components/ui`; pages may not use `style=`, animation or transition classes, or hex colours.
- **shadcn/ui with the Radix base and the Nova preset.** shadcn 4 asks for a base library; Radix is the classic one most shadcn examples use.

## Database

- **The client can read but never write posters, versions, findings, reviews or the audit log.** Besides having no write policies, those tables have their client write privileges revoked. All status changes go through the backend, which enforces the status machine in `app/state.py`.
- **`toppers.consent_path` is hidden by a column grant, not just a policy.** Policies filter rows, not columns, so the column's `select` privilege is withheld from every client. A generated `has_consent` column shows whether consent exists. Head office opens consent files through the backend's short-lived signed URL. Clients therefore select topper columns by name (`select *` is refused).
- **Added a `rule_settings` table** (not in the original table list) so head office can switch checks on and off from the Rules page. The checks themselves stay in `rules/rule_pack.json`, under version control.
- **Three storage buckets:** `posters` (private, read through signed URLs by anyone who can see the poster), `consent` (private, no client access at all), and `brand` (public, holds only the logo).
- **Regional managers see posters by region, through `branches.region_id`.** One helper, `can_see_branch()`, holds the visibility rule for all poster tables, so it is written once.
- **Policies are tested against the live database** by `scripts/check_rls.py`, which signs in as the demo users. Re-run it after any policy change.

## Rule engine

- **A rule returns only its problems; the registry writes the pass row.** Rules stay short (no bookkeeping), and every enabled check still leaves a row, so the findings view can list passed checks.
- **The registry refuses to start if `rule_pack.json` and the code disagree.** A rule in the pack with no code, or code with no pack entry, is a startup error instead of a silently skipped check.
- **AI findings are forced to `warn` in one place** (`registry.to_finding`), and the database has a constraint that says the same. Neither can be bypassed by a rule.
- **Wording flags with an unknown rule id are kept in the reading and shown as questions, not findings.** Only `BRAND-04` and `AI-01` can become findings.
- **Three reader checks (`READ-01` to `READ-03`) sit beside the 17.** They come from the pipeline, not from rules: reader failed, two readers disagree about a number, or a person on the poster isn't confidently identified. All need a person (`needs_human`), except a tag with nobody on the poster, which is a `warn`.
- **One finding per offending line for banned claims (CCPA-01),** listing every phrase it matched. "100% selection guaranteed" matches two phrases but is one thing to fix.
- **Rank truth is CCPA-04's job; CCPA-05 checks that rank, course, duration and paid/free are shown and that the last three are true.** Splitting it this way means a wrong rank is reported once.
- **Course mentions use fuzzy matching (RapidFuzz `partial_ratio` ≥ 90).** That is what catches "2-Year Crash Course": it matches "1-Year Crash Course" closely, and the duration then disagrees. Aliases of five letters or fewer (such as "AITS") must match as a whole word.
- **Name matching uses RapidFuzz `WRatio`: 85 or more is a match, 70 to 85 goes to a person** (as the brief sets out), against the full name and every listed variant.

## Pipeline

- **Model: `gemini-3.5-flash`.** `gemini-2.5-flash` (the first choice) returns "no longer available to new users" on our free-tier key. 3.5 Flash returned correct JSON for an image in 4–21 s; 3.8 Flash also worked but took 79 s.
- **The schema goes to Gemini as JSON Schema** (`response_json_schema=PosterReading.model_json_schema()`, google-genai 3.0), and the reply is validated again with Pydantic. Invalid output is retried up to 2 times.
- **Backup reader on Groq (`qwen/qwen3.8-27b`, a vision model, JSON mode).** If Gemini itself fails (quota, outage), the same prompt and schema go to Groq. This happened in our first live test: Gemini returned 503 "high demand" and Groq read the Hindi test poster correctly, including the disguised guarantee. A failing service isn't retried (that rarely helps); only invalid output is. If every reader fails, the version gets one `READ-01` finding for a person and no checks run.
- **Readings are reused by image hash and caption.** The brief says image hash; including the caption matters because the AI also judges caption wording. Live readings are never reused in fixture mode and vice versa.
- **Second read tolerance.** Tesseract may only answer in digits, so it turns the "AIR" in "AIR 73" or the "₹" in "₹48,000" into stray digits. The readings agree if Tesseract's digits end with Gemini's and have at most 3 extra leading digits; phone numbers compare their last 10 digits. Anything else, or nothing read, goes to a person.
- **Without Tesseract (e.g. on a laptop that hasn't installed it), the second read is reported as not done** (`READ-02`, needs a person), never skipped silently.
- **Visual thresholds**, tuned on the 11 test posters (`tools/make_test_posters.py`):

  | Check | Threshold | Clean posters | Planted problem |
  |---|---|---|---|
  | Logo (`matchTemplate`, 16 sizes from 5% to 35% of the width) | ≥ 0.7 | 0.93 (blank page: 0.00) | — |
  | Palette (k=6 in Lab, ignore < 5%, flag ≥ 10% of the area) | ΔE > 20 | max 0.3 | lime background: 57.9 |
  | Contrast (k=2 per text box, WCAG ratio) | < 4.5:1 | lowest 8.5:1 | pale disclaimer: 1.43:1 |

  OpenCV's random seed is fixed before every k-means, so results are repeatable.
- **Test posters use the Nirmala UI font** (ships with Windows), which covers Latin, ₹ and Devanagari. This Pillow build has no text shaping (no libraqm), so Devanagari conjuncts and Bengali vowel signs render wrongly; the Hindi test poster uses phrases without them ("नया बैच शुरू", "सीट तय है!"). Bengali is covered by unit tests instead.

## Demo data

- **Fictional phone numbers start with `+91 1`.** India doesn't give numbers in that range to subscribers, so no demo number can belong to a real person.
- **A fourth demo account, `staff.kolkata@pramaan.demo`,** exists so we can show and test that one branch can't see another branch's posters.
