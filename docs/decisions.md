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

## API and status machine

- **The status machine is pure functions (`app/state.py`), separate from the routes.** Every rule in the brief (no approving your own poster, no approval with open blocks, overrides only by head office with a reason) is unit-tested without a database, and the routes can't skip a rule because they only apply the transition `state.py` returns.
- **The backend checks visibility itself.** It uses the secret key, which bypasses row-level security, so `state.can_view()` repeats the policy rule (head office: all; regional: own region; staff: own branch). A poster you can't see answers 404, not 403, so it doesn't reveal that it exists.
- **Login tokens are verified with `supabase.auth.get_claims()`,** which checks the token's ES256 signature against the project's published keys. No call to Supabase per request; forged or expired tokens are refused.
- **The checks run inside the upload request** (about 20 s live, under 3 s with a cached reading). Simple, and the upload page shows a progress state. If the checks crash, the version is still marked checked, with a `READ-01` finding for a person, so a poster can never get stuck in `draft`.
- **The pipeline finishing writes a `checked` row to `reviews`,** so every transition is in the history, as the brief requires. The `reviews.action` check constraint gained `checked` for this (applied to the live database too).
- **Sending back needs a comment.** Without one the branch doesn't know what to fix.
- **A reviewer's note when confirming a reading is stored in `findings.override_reason`,** the same column as an override reason (the table has one note column), and also in `reviews.comment` so it shows in the history.
- **Gemini gets one more try after a 503** ("high demand, try again later"), 3 s later, before the Groq backup takes over. On 7 Nov 2026 Gemini 3.5 Flash returned 503 on most live calls; Groq carried every read.
- **Contrast is measured only where a box holds text.** In live mode a reader's box sometimes slips onto plain background; k=2 then splits one flat colour into two and reports 1:1 "contrast", a false warning (seen on the clean poster read by Groq). A box is measured only if its second cluster covers at least 2% of the box and is at least ΔE 5 from the first. Genuinely faint text still counts: the pale test disclaimer has its text cluster at 19.5% of the box and ΔE 13.7.
- **`scripts/e2e_flow.py` runs the whole Round 2 flow over HTTP as the demo users** (25 steps, including the forbidden moves). Point it at the deployed API before a demo.

## Final frontend (revamp, 7 Nov)

- **The temporary frontend became the final one.** The separate frontend isn't coming, so we revamped the in-repo one instead of starting again: `src/api/` stayed the contract, and only components and pages changed.
- **Palette: Black & Gold.** Prussian blue #14213D is the ink, black the midnight canvas, alabaster #E5E5E5 the lines, white the light surface. Orange #FCA311 has one job, the action to take and what's selected, so it always means "here". Severity colours stay separate (red blocks, blue needs a person, amber warns, green passed) because they carry meaning; each has a light and a midnight value with at least 4.5:1 contrast on its tint.
- **Themes are CSS variables only.** `data-theme` on `<html>` picks the light or midnight set in `styles/tokens.css`; switching changes one attribute, so nothing re-renders, and the browser cross-fades it (View Transitions) unless the person asked for reduced motion. A tiny script in `index.html` sets the theme before the first paint, so midnight users never see a white flash. The sign-in brand panel sets `data-theme="dark"` on itself, so it is midnight in both themes.
- **No decoration.** No gradients, shadows only on overlays, no hover lifts or scaling, skeletons that don't shimmer (and appear only after 150 ms, so fast loads don't flicker). Motion only answers an action: the theme cross-fade, the passed-checks reveal, scrolling to the finding you picked on the poster, the page-loading bar.
- **Optimistic updates** (`api/hooks/optimistic.ts`). Submit, approve, send back, confirm a reading, override, rule switches and every rulebook edit show their result at once, everywhere the data is cached (the poster page and every list it's in), and go back exactly as they were if the server refuses. Uploads and new versions can't be predicted (the checks decide), so instead a new poster appears in My posters as "running checks" straight away.
- **Honest progress.** The server doesn't report progress during the checks, so the upload screen says what is happening and counts the seconds, instead of a fake progress bar.
- **Pages load on demand** (route-level `lazy` in `routes.tsx`). Recharts (about 360 KB) now loads only on Insights, and the bundle warning is gone. Pointing at a poster row starts loading that poster, so it opens without a wait.
- **Pages do layout only, enforced.** A local ESLint rule (`pramaan/layout-only`) fails the build if a page uses any class that isn't flex, grid or gap; `fetch` and the Supabase or API clients can only be used inside `src/api`. Tables, panels and states live in components, so pages stay short and readable.
- **Phones:** tables turn into labelled stacked rows (`ui/DataTable`), the menu slides in from the left, and a poster's next action stays fixed at the bottom of the screen.

## Temporary frontend (first version)

- **`src/api/` is the contract for the final UI.** `client.ts` signs every backend call with the Supabase session; `schema.d.ts` is generated from the backend's OpenAPI; `types.ts` gives friendly names; `hooks/` holds every read and write. Pages never touch `fetch` or `supabase`.
- **Lists and rulebook edits go straight to Supabase; checks and review actions go to the backend.** Row-level security scopes each list (a branch sees its own posters, a region its branches), so the list pages have no permission logic of their own.
- **Topper columns are selected by name** because `consent_path` is hidden from the browser (`select *` would be refused).
- **Findings share one numbering on the poster and in the list** (`lib/findings.ts`). Findings that point at the same spot share one box with several numbers, and clicking it steps through them; smaller boxes sit on top of bigger ones, so a rank inside a topper's card stays clickable.
- **The wrong-rank finding (CCPA-04) points at the rank itself** when the reader boxed it, not the whole topper card, so the box marks the exact number to change.
- **Motion is used twice:** a short pulse on the finding or box you click, and a fade when you open the passed checks. Both live in `lib/motion.ts` and `components/ui/Highlight.tsx`; `MotionProvider` respects "reduce motion". shadcn's drawer and dialog animations stay inside `components/ui`.
- **Fonts:** Source Serif 4 (bold, headings) and Source Sans 3 (body), from Google Fonts, replacing the Geist font shadcn installs by default.
- **Checkboxes use a separate `<label htmlFor>`.** Wrapping a Radix checkbox in a `<label>` toggled it twice, so tags silently didn't stick (found while testing the upload page in a real browser).
- **The demo-account buttons on the login page need `VITE_DEMO_PASSWORD`.** It's the same password the README lists for the judges; leave it empty to hide the buttons.

## Deployment

- **The API deploys through a Render deploy hook, triggered by GitHub Actions after the backend tests pass** (`.github/workflows/backend.yml`). The Render service deploys the public repo by URL rather than through Render's GitHub app, so the repo can stay on the main GitHub account while the service runs on a different Render account. A push that breaks a test never reaches the live API.
- **Render's Root Directory is `backend`.** The Dockerfile lives in `backend/`; without that setting Render looks for one at the repo root and the build fails.
- **A scheduled GitHub Action keeps the demo awake** (`.github/workflows/keep-awake.yml`, every 10 minutes). Render's free instance sleeps after 15 idle minutes and then makes the next visitor wait about a minute; Supabase pauses a free project after a week without use. The job calls `/health?db=true`, which reads one row, so one call keeps both awake. Awake all month, the API uses about 720 of Render's 750 free hours. If the API or the database is down, the run fails and GitHub emails the owner, so it doubles as an uptime alert.
- **`ALLOWED_ORIGINS` forgives a bare domain** (`pramaanapp.vercel.app` is read as `https://pramaanapp.vercel.app`), spaces, quotes and a trailing slash, and the API logs the origins it allows at startup. A missing origin is the most likely deploy mistake, and the browser's CORS error doesn't say which origin the server expected.

## Demo data

- **Fictional phone numbers start with `+91 1`.** India doesn't give numbers in that range to subscribers, so no demo number can belong to a real person.
- **A fourth demo account, `staff.kolkata@pramaan.demo`,** exists so we can show and test that one branch can't see another branch's posters.

## Brand

- **Pramaan's logo is a vector rebuilt from the team's PNG** (`tools/make_brand_assets.py`). The P mark is drawn as strokes measured on the PNG: every stroke is 13.8 units wide with square ends, the two curves of the bowl are cubic Béziers fitted to the PNG within 0.4 px, and the check mark cuts the bowl (each curve is clipped on its side of the check). The lettering is Poppins Medium and Regular (SIL Open Font License), placed letter by letter where the PNG has it and turned into outlines, so the logo needs no web font. Rendered in a browser and compared with the PNG, the shapes overlap 96–98%.
- **The logo follows the theme.** In the app, `components/ui/BrandLogo.tsx` draws it inline: the name takes the current text colour and the tagline the muted text colour. The PNG's light version had cream lettering on a light background, which was nearly invisible; the vector versions use navy on light and cream on dark (`docs/brand/`). The README picks the version that matches the reader's GitHub theme.
- **The favicon is the P mark alone** (SVG, plus `favicon.ico` and a 180 px Apple touch icon for browsers and phones that don't use SVG). Its blue and gold read on both light and dark browser tabs.
- **Pramaan's logo is not Northfield Academy's.** Northfield's logo (`backend/assets/northfield-logo.png`) belongs to the fictional demo institute and is what the logo check (BRAND-01) looks for on posters.

## Organisations, team and imports (7 Nov, later)

- **Many organisations on one Pramaan, each seeing only its own data.** A new company signs up and becomes its own head office. Every company-owned table gained `org_id`; names are unique within an organisation; `my_org()` starts every RLS policy; two-column foreign keys `(id, org_id)` stop references across organisations at the database level, so even a bug in the API couldn't link one company's branch to another's region. The migration (`supabase/migrations/2026-11-07_organisations.sql`) moved the demo data into the first organisation; `schema.sql` and `policies.sql` include organisations for new installs. Rehearsed on an in-memory Postgres (PGlite) before running on the live database, in one transaction.
- **The old one-column foreign keys were dropped.** With both kept, the database API saw two ways to join posters to branches and refused to guess (PGRST201). The two-column keys enforce everything the old ones did.
- **Removing someone's access keeps their history.** Deleting a person would break the audit trail (they created posters and reviews), so head office bans the sign-in and sets `deactivated_at`; `my_org()` and `my_role()` then return nothing for them.
- **Temporary passwords instead of email invites.** Free email sending is rate-limited and needs the project's redirect URLs set up; head office already knows how to reach its staff. The password is random (about 59 bits), shown once, never stored by us, and must be replaced at first sign-in.
- **CSV imports, checked on the server, all or nothing.** Parsing and checking live in `app/imports.py` with no database access, so they are unit-tested. It reads files the way spreadsheets write them (Excel's byte-order mark, "₹48,000", yes/no, DD/MM/YYYY) and reports every problem by line and column with how to fix it. A file is written only when every row is valid; rows matching an existing name update it. CSV only: Excel and Google Sheets export CSV, and Excel support would need a new library. Rulebook exports use the same columns, so they import back.
- **Nothing in the product names Northfield any more.** The AI prompt and the logo check use the organisation's registered name from its brand kit; the rule groups come from the rule pack's own `categories`.

## Design, third pass (7 Nov, later)

- **A quiet work tool, not a showcase.** One typeface (IBM Plex Sans, with Plex Mono for IDs and numbers) instead of a serif display face; 14 px body text; small page titles; compact tables; no eyebrow labels, numbered marketing steps, gradients, glows or hover lifts. Feedback was that both earlier designs looked machine-made, and these were the tells.
- **Prussian blue is the primary button in light, alabaster in midnight; orange marks focus, selection and "needs you".** Using orange for every action made warnings and actions look alike.
- **From the teammate's prototype:** a public product page, search and filters on long lists, the audit log's AI filter, the brand kit edited in place, and topper consent shown beside the result date. Its seeded fake numbers, uppercase labels and "judge state tester" were left out.
- **The product page shows a real poster.** The preview uses a fictional test poster with the boxes from its fixture reading, rather than an illustration.

