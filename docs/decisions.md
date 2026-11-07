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

## Demo data

- **Fictional phone numbers start with `+91 1`.** India doesn't give numbers in that range to subscribers, so no demo number can belong to a real person.
- **A fourth demo account, `staff.kolkata@pramaan.demo`,** exists so we can show and test that one branch can't see another branch's posters.
