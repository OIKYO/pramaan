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
- **The demo-account buttons on the login page needed `VITE_DEMO_PASSWORD`.** Removed on 8 Nov (see below): the password was built into the browser bundle, and the public pages no longer point at the demo.

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

- **Many organisations on one Pramaan, each seeing only its own data.** A new company signs up and becomes its own head office. Every company-owned table gained `org_id`; names are unique within an organisation; `my_org()` starts every RLS policy; two-column foreign keys `(id, org_id)` stop references across organisations at the database level, so even a bug in the API couldn't link one company's branch to another's region. A one-off migration moved the demo data into the first organisation; `schema.sql` and `policies.sql` include organisations for new installs. Rehearsed on an in-memory Postgres (PGlite) before running on the live database, in one transaction.
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

## Rulebooks for any industry (8 Nov)

- **What an organisation does is data, not code.** `backend/app/catalog.json` lists 30 industries and 516 subdomains (the list Oikyo gathered), 12 kinds of organisation and 10 things organisations check posters for. Following the advice that came with the list, industry, kind of organisation and focus are kept separate: a college, a student club and an esports team differ in kind but can share rulebooks.
- **Rulebooks instead of fixed categories.** The 17 checks are grouped into 7 rulebooks: brand kit and branch contacts (every organisation keeps these), honest claims, offerings and prices, approved figures, people and consent, and exam results for coaching ads (CCPA 2024), which brings people and offerings with it. The industry only *suggests* rulebooks; head office decides, and changing the industry never switches a rulebook by itself. A rule outside the kept rulebooks doesn't run at all, rather than running and being hidden, so a restaurant's poster is never blocked by a coaching rule.
- **One set of tables, the organisation's own words.** Courses, results figures and toppers keep their tables (renaming them would have broken every existing poster's history), but the screens and findings use the industry's words: "Menu and prices", "Impact figures", "Players and consent". Fields only coaching institutes have (course type and duration, a figure's exam, a person's rank and result date) became optional; the exam results rulebook asks for them again.
- **The industry picker searches everything at once.** One search box across all 516 subdomains, grouped under their industry, instead of 30 options then a second list. If nothing fits, the organisation types its own words and picks the closest industry, which sets the vocabulary.
- **Data imports follow the rulebooks.** Only datasets of kept rulebooks can be imported, titled in the organisation's words; `price` is accepted as a column name for `fee_inr`.
- **Migration:** applied to the live database after a rehearsal on an in-memory Postgres (fresh install and migrated database end up with the same columns). The demo organisation keeps every rulebook as a coaching institute.

## Design, fourth pass (8 Nov)

- **Mona Sans, and no monospace anywhere.** Feedback was that the type still looked machine-made. Mona Sans (GitHub's typeface, on Google Fonts) is one family with a width axis: the interface uses its normal width and page titles a semi-expanded 112.5%. Numbers use its tabular figures. A lint rule bans `font-mono`.
- **Midnight is onyx, with no blue.** Neutral greys from #0d0d0d, an off-white primary button, and a warm amber accent (#e9a23b) for focus and selection (a matte sand was tried first and read as washed out). Severity colours are matte, and "needs a person" is a neutral grey instead of blue. The logo's blue P is drawn off-white in midnight; light mode keeps the team's colours.
- **One theme control.** Settings has one segmented control and the account menu one Theme entry with a submenu; the switches on the product page and sign-in pages are gone.
- **The product page follows Oikyo's sketch**, inspired by Railway's: centred headline, a large product window, a four-cell strip, "Why Pramaan?" with a still of each feature, "Built for many branches", "Start for free", and a four-column footer, all between two hairline rails. Signed-in people opening `/` go straight to their dashboard, without the product page flashing first.
- **Settings follows Oikyo's sketch:** your account (with edit), organisation and industry on the left; security (password, sign out everywhere) and preferences (theme, reduce animations) on the right. A Hindi interface was sketched under preferences; it's left out until the whole app is translated, because a switch that changes only some words would mislead.
- **Switches use their own token, `--control-on`:** a deeper amber in light (#c77c06, over 3:1 against white) and a vivid amber in midnight with a dark thumb, so on and off are obvious. Locked switches stay in full colour.
- **The product page runs edge to edge.** No centred column: every section shares one side margin, and the two-column sections use the full width. The example poster page is interactive (pick a problem or its box, open the passed checks, try Approve) without touching a server. The top-bar menus open on hover.
- **Privacy, terms and cookies pages** say plainly that Pramaan is a hackathon pilot, what is stored, what goes to the AI, and that there is no tracking.

## General rulebooks and the organisation profile (8 Nov, later)

- **Four general rulebooks, ten checks, all in code.** Following the suggestions Oikyo gathered, the rulebooks list stays short (11) but each holds several checks:
  - *Dates, deadlines and availability:* dates that don't exist (EVENT-01), a weekday that doesn't match its date (EVENT-02), a last date or start date that has passed (EVENT-03).
  - *Offers, discounts and terms:* an offer with no end date (OFFER-01) or no pointer to its conditions (OFFER-02), and a percentage or saving that doesn't match the prices shown (OFFER-03).
  - *Copyright and asset permissions:* stock-library watermarks (RIGHTS-01), and other organisations' names or logos that head office hasn't approved (RIGHTS-02). The reader now lists other organisations it sees.
  - *Legal and regulatory compliance:* disclaimers head office requires on every poster (LEGAL-01), and claims an industry may never make, such as guaranteed returns in finance (LEGAL-02, lists in `catalog.json`).
  Checks that would need records we don't keep (event calendars, licences) or the Round 3 disclaimer size check were left out rather than faked.
- **Three behaviours instead of eleven switches.** *Always on* (brand kit, branch contacts, honest claims, people and consent, copyright) can't be switched off. *Conditional* rulebooks act only when a poster shows a price, figure, date, offer or claim; dates, offers and legal start on for everyone, offerings and figures when the industry or kind of organisation calls for them. *Domain-specific* (exam results for coaching ads) comes with the industry or with "Coaching or training institute". Head office can still switch off any conditional or domain rulebook.
- **The organisation has its own page.** Organisation › Profile holds the name, what it does and the rulebooks it keeps; Settings is only about the person. Until the industry and kind of organisation are filled in, the Profile menu item and the account menu's Organisation carry a marker, and the page explains why.
- **The demo is no longer advertised.** Northfield Academy and its accounts stay in the database (for judges, who get the logins from the README), but the product page, its menus and the sign-in page no longer link to it. The product page's example is labelled as an example with a fictional poster.
- **Migration:** two brand-kit lists, and the general rulebooks switched on for existing organisations; rehearsed on an in-memory Postgres.

## Invites, join codes and passwords (8 Nov, later)

- **Two ways in, both without email.** Pramaan still sends no email, so people pass links and codes on themselves.
  - *Invite links* name a role and a branch or region, work once and expire after 7 days. Head office invites anyone; regional managers invite branch staff for branches in their own region (`app/invites.py`, unit-tested). Only a SHA-256 hash of each link's token is stored, so a link is shown once, like a temporary password.
  - *Join codes* (like `K7MQ-X3VP`, from an alphabet without 0/O or 1/I/L) let someone create their account and join as branch staff of the branch they pick. The code is readable only through the API, by head office and regional managers; browsers can't select it from the table (column grants). Head office can replace it at once if it leaks. The public join endpoints are rate-limited per address (20 tries in 10 minutes) so codes can't be guessed.
- **Passwords need 8 characters, a number and a special character**, checked by the server and, as people type, by `PasswordInput`: it names only the next thing to fix, fills three bars, and turns red when the person stops typing with something missing. The head office password is called the *organisation password*, with a note that it can't be recovered.
- **Small things that make the site feel finished:** theme-coloured thin scrollbars; smooth anchor scrolling; menus and popovers that fade and lift open; the passed-checks list opens smoothly; a slight press on buttons; a cookie notice once per browser, bottom left; a real 404 page for every unknown address; and on phones a solid top bar (blurring it while scrolling stutters) and no sideways scroll.
- **`docs/copy-brief.md`** gives a copywriter every true fact about Pramaan, the voice, and the exact pieces of text needed, so the product, enterprise and legal pages can be written without inventing anything.
- **Migration:** rehearsed on an in-memory Postgres, then applied to the live database.

## Website text, legal pages and deletion (8 Nov, later)

- **The website's words were written from `docs/copy-brief.md`** and pasted in. The long pages (Product, Enterprise, About, Privacy, Terms, Cookies) live as Markdown in `frontend/src/content` and are drawn by a small renderer (`lib/markdown.ts`, `components/content`) that builds page elements, never raw HTML, so the text can be swapped without touching code. No new library was needed.
- **No invented facts in the legal pages.** The copy marked what it couldn't know with `[NEED: …]`. Each was filled with something true or made true:
  - *Who runs Pramaan:* the team, in India, not yet a registered company; Indian law applies to the terms.
  - *Where data lives:* Supabase in AWS Mumbai, Render in Singapore, Vercel's global network; Google and Groq process images in their own data centres, with links to their terms.
  - *Account data and browser storage:* listed field by field and key by key, from the code.
  - *Retention and deletion:* the policy describes processes that now exist. Head office can delete the whole organisation (`POST /organisation/delete`, the name typed again), which removes its posters' images, consent files, logo and every member's sign-in. Anyone can delete their own account (`POST /me/delete`): name and email removed, sign-in disabled, their posters and reviews kept as a former member's. An organisation's only head office can't delete their account and leave it headless.
  - *Contact:* the GitHub issues page, with a way to ask for private contact. A contact email is still to be decided and isn't made up.
- **CSV export** was already there, so the Enterprise page says so.

## Keeping the API awake, take two (8 Nov, later)

- **GitHub's scheduler isn't reliable enough.** The keep-awake workflow is set to every 10 minutes, but GitHub ran it 3 times in a day: free scheduled jobs are delayed or dropped when GitHub is busy. Render then slept, and the first page after a quiet spell showed loading placeholders for about a minute.
- **Supabase's scheduler does it now.** `pg_cron` with `pg_net` (both free on Supabase) calls `/health?db=true` every 10 minutes from inside the database (the last part of `supabase/schema.sql`). The GitHub workflow stays as a backup and an uptime alert.
- **The site helps too.** It calls `/health` the moment anyone opens it, so the server is waking while they read or type; and any loading state that lasts more than 4 seconds says the server may be waking and how long that takes.
- **The API's bare address** now answers with its name and links instead of "Not Found".

## Round 3: consent links, posts with more pages, and a reliability report (11 Nov)

- **Consent is asked per person, and from a poster it shows that exact poster.** A link made from a "no consent" finding
  stores the poster version, the person's box and every line printed about them, so the person approves exactly what they
  saw. The consent then covers that person on the chosen channels until the chosen date, like a signed form does.
  `toppers.consent_source` says whether consent came from a signed file or a link; `has_consent` follows it.
- **Approving clears findings by code, not by hand.** The CCPA-03 validity checks moved into one function,
  `consent_problems()`, which both the rule and the consent link use. When someone approves, every open CCPA-02 or CCPA-03
  finding about them on a poster not yet approved is resolved, but only if the new consent covers that poster's channel
  today. The history says the consent link did it, with who signed.
- **Withdrawing reopens posters.** Withdrawal turns the person's consent off at once. Every poster in review or approved that
  shows them (by staff tags or by a finding about them) gets a blocking CCPA-02 finding and goes back to its branch
  (`state.consent_withdrawn`), with a history entry and an audit row. Reviews may therefore have no actor: the consent link
  isn't a member. No email is sent: Pramaan still sends none, so head office passes links on, as with invites.
- **Pages are stacked, so the rules didn't change.** Each page is read, second-read and visually checked on its own boxes,
  then the readings are stacked (page *n* has y from 1000·*n*). The 27 rules run once on the stacked reading, unchanged:
  presence checks (disclaimers, registered name) look across the whole post, and proximity checks stay within a page because
  pages never overlap. The box check accepts y up to 10 000, and every page's reading is clamped to its own page before
  stacking. Single-image posters are page 0, so nothing about them changed.
- **One AI call per page, cached per page.** `poster_versions.pages` keeps each page's image, hash and reading, so a fixed
  version that changes one page of a brochure re-reads only that page. A page the reader can't read gets its own READ-01;
  the other pages are still checked.
- **PDFs with pypdfium2.** It renders pages without system packages (unlike Poppler) and is BSD/Apache licensed (unlike the
  AGPL PyMuPDF). Up to 10 pages, 25 MB.
- **Fifty posters with known answers.** The generator plants each problem on purpose and records a perfect reading, and the
  test suite proves that with it every poster fails exactly its planted checks, so the ground truth is checked by the same
  rules. A poster can also list AI flags that are fair on it ("also"): on a planted guarantee, the AI's guarantee and tone
  flags don't count as false flags.
- **What the report scores.** The 27 rule checks are scored for catch rate and false flags; the reader's questions for a
  person (READ-02, READ-03) are reported separately, because asking instead of guessing is the designed behaviour. Dates are
  checked as of 7 Nov 2026, so the date checks give the same answer whenever the report runs. Each run saves the AI's
  reading, so the second read and the rules can be checked again (`--rescore`) without new AI calls. A run the reader
  couldn't finish (both readers out of quota) isn't scored, and the page says how many there were.
- **Not built:** the disclaimer size check from the Round 2 plan; the three improvements came first.

