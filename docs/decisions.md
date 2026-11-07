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

## Demo data

- **Fictional phone numbers start with `+91 1`.** India doesn't give numbers in that range to subscribers, so no demo number can belong to a real person.
- **A fourth demo account, `staff.kolkata@pramaan.demo`,** exists so we can show and test that one branch can't see another branch's posters.
