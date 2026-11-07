# Pramaan: project brief for Claude Code

This file is the source of truth for the project. Read it fully before doing anything, follow it, and keep the **Status** section at the bottom up to date as work gets done.

---

## 0. Hackathon rules (non-negotiable)

This is our entry for **CodeNexus India 2026** (We Code Coders), problem statement **Brand Governance by Inkloom AI**. Team **HEISEN-DE-BUG**.

- **Build window:** Round 2 runs 6–9 Nov 2026 (check the official group for the exact deadline time). Only work done inside the window counts, and judges can inspect commit history.
- **Commit small and often** with clear messages. Never squash or rewrite history.
- **Never commit secrets.** `.env` files are git-ignored. Ship `.env.example` files instead.
- **Disclose AI.** Whenever you (Claude Code) write a significant part, add a line to `docs/ai-disclosure.md` saying which file or feature and what tool wrote it. The rules require this.
- **Contributions must be true.** Never author commits as another team member.
- **Fictional data only.** No real students, institutes or phone numbers anywhere: seeds, tests, fixtures or screenshots.
- **Gemini free tier.** Google may use free-tier inputs to improve its models. That is one reason all demo data is fictional. Say so in `docs/architecture.md` under privacy.

### Team roles

| Member | Owns |
|---|---|
| Oikyo Chowdhury | AI and backend: reading pipeline, rule engine, API, database, deployment |
| Rishav Nandi | Research and rules: CCPA rule pack content, demo brand and register data |
| Rudrapriyo Chatterjee | Frontend: the final UI (being built separately, see section 2) |
| Zihan Sirat | Testing and docs: test posters, user testing, documentation, demo video |

---

## 1. What we are building

**Pramaan** checks every poster made by the branches of a multi-branch organisation before it is published. Our demo is a fictional coaching institute chain, **Northfield Academy**.

Branch staff upload a poster. Pramaan reads it, runs **17 checks** (15 in plain code, 2 by AI) against head office's brand kit, approved facts, a consent-backed toppers register and a rule pack based on the **CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024**. It shows each problem on the poster with the rule it breaks and a suggested fix. A regional manager reviews, then head office gives final approval. **The AI never approves anything.**

**Round 2 goal (must work by 9 Nov):** one poster goes from upload → read → 17 checks → findings with fixes → resubmit → regional review → head office approval, on a live deployed link.

Round 2 judging (out of 100): core workflow runs end to end (30), technical depth and reliability (25), progress against the plan (20), the three named improvements (15), usability (10). Prioritise in that order.

---

## 2. The frontend situation (important)

> **Update, 7 Nov:** the separate frontend isn't coming, so the in-repo frontend is now the final one. Oikyo revamped it (with Claude Code) on the Black & Gold palette, with light and midnight themes. The rules below about `src/api/` and thin pages still apply; `frontend/AGENTS.md` has the current rules, and `npm run check` enforces most of them.

Rudrapriyo is building the **final frontend separately**. Until his files arrive, build a **temporary, good-enough frontend** so the whole flow works and can be demoed and tested.

- **The stable contract is `frontend/src/api/`**: the API client, generated types and data hooks. His pages will be dropped in on top of it, so design it carefully and don't break it later without asking.
- Keep pages thin: pages only arrange components and call hooks. That makes swapping them out easy.
- When the final frontend files arrive, merge them in: keep `src/api/`, map his pages onto our hooks, run `npm run check`, and fix type errors. Don't rewrite his design.
- Quality bar for the temporary frontend: clean, consistent, usable on desktop and phone. It does not need to be polished.

---

## 3. Architecture

```
React + Vite (Vercel)
   │  supabase-js: login, lists, rulebook reads/writes   (row-level security applies)
   │  fetch + Supabase JWT: checks, review actions, consent files, insights
   ▼
FastAPI (Render, Docker)
   ├─ pipeline/reader.py   Gemini: one call per poster version → strict JSON
   ├─ pipeline/ocr.py      Tesseract: second read of key numbers
   ├─ pipeline/match.py    RapidFuzz: names on poster ↔ toppers register
   ├─ pipeline/visual.py   OpenCV/Pillow: palette, logo, contrast
   └─ rules/               15 code checks + 2 AI checks → findings
   ▼
Supabase: Postgres (+ RLS), Auth, Storage
   ├─ bucket `posters`   (signed URLs)
   └─ bucket `consent`   (private; backend only, head office gets short-lived signed URLs)
```

Key decisions (record the reasoning in `docs/decisions.md`):
- **Code decides, AI reads.** Gemini only extracts text and flags wording. All verdicts on consent, ranks, fees and disclosures are deterministic Python, so the same poster always gets the same result.
- **One Gemini call per poster version**, cached by image SHA-256, to stay inside free-tier rate limits.
- **Two readers for key numbers.** If Gemini and Tesseract disagree, Pramaan asks a person instead of guessing.
- **Consent files never go to the AI.** Only the poster image and caption are sent to Gemini.
- **No face recognition.** Branch staff tag the students shown; untagged people go to a reviewer.

---

## 4. Repo layout

```
pramaan/
  CLAUDE.md
  README.md                  what it is, live links, demo accounts, how to run
  backend/
    app/
      main.py                FastAPI app, CORS, routers
      auth.py                verify Supabase JWT, load profile + role
      config.py              settings from env
      db.py                  Supabase client (service role, server only)
      routers/               posters.py, findings.py, toppers.py, insights.py, rules.py
      models.py              Pydantic models (API + reader schema)
      state.py               poster status machine + permission rules
    pipeline/                reader.py, ocr.py, match.py, visual.py, run.py
    rules/
      rule_pack.json         the 17 rules: id, name, reason, kind, severity, enabled
      registry.py            @rule decorator, runs enabled checks
      claims.py  facts.py  brand.py  access.py
    scripts/seed.py          creates demo users + data
    tests/                   pytest; fixtures/readings/*.json
    Dockerfile  requirements.txt  .env.example
  frontend/
    src/
      api/                   client.ts, schema.d.ts (generated), hooks/*.ts   ← stable contract
      styles/tokens.css      all colours, spacing, radius, durations
      lib/motion.ts          the ONLY place animations are defined
      components/ui/         Button, Card, Badge, Input, Select, Modal, Drawer, Tabs, Table, Toast, Skeleton, EmptyState, ErrorState
      components/poster/     PosterCanvas, FindingCard, FindingList, StatusPill, VersionCompare
      layouts/AppShell.tsx   sidebar per role
      pages/                 one folder per page (section 11)
      routes.tsx
    AGENTS.md                rules for AI tools working on the frontend
    .env.example
  supabase/
    schema.sql  policies.sql
  tools/
    make_test_posters.py     generates fictional test posters with planted problems
  docs/
    architecture.md  decisions.md  ai-disclosure.md  user-testing.md  contributions.md
```

---

## 5. Stack

- **Backend:** Python 3.12, FastAPI, Pydantic v2, `google-genai` (Gemini SDK), `pytesseract`, `rapidfuzz`, `opencv-python-headless`, `Pillow`, `supabase` (supabase-py), `pytest`.
- **Frontend:** React + Vite + TypeScript (strict), Tailwind, shadcn/ui for primitives, React Router, TanStack Query, `@supabase/supabase-js`, Motion (only inside `lib/motion.ts` and `components/ui`), Recharts for insights, `openapi-typescript` for types.
- **Infra:** Supabase free tier, Render free tier (Docker), Vercel free tier, GitHub. Total cost ₹0.

Library APIs change. Before using `google-genai`, `supabase-py`, Tailwind or shadcn, check the installed version and its docs instead of guessing.

---

## 6. Database (Supabase)

> **Update, 7 Nov:** many organisations now share the database. Every company-owned table below also has `org_id`, names are unique per organisation, and `organisations` holds each company. See `supabase/schema.sql` and `docs/decisions.md`.

Enums:
- `user_role`: `branch_staff`, `regional_manager`, `head_office`
- `poster_status`: `draft`, `checked`, `in_review`, `changes_requested`, `approved`
- `review_stage`: `regional`, `head_office`
- `channel`: `print`, `instagram`, `whatsapp`
- `finding_kind`: `code`, `ai`, `reader`
- `severity`: `block`, `warn`, `pass`, `needs_human`
- `finding_status`: `open`, `resolved`, `overridden`
- `course_type`: `classroom`, `crash`, `test_series`, `online`

Tables:
- `regions` (id, name)
- `branches` (id, name, city, region_id, phone, address)
- `profiles` (id → auth.users, full_name, role, branch_id, region_id)
- `brand_kit` (single row: registered_name, helpline, palette text[] of hex, logo_path, banned_phrases text[], tone_notes, updated_at)
- `courses` (id, name, aliases text[], course_type, duration_label, duration_months, fee_inr, is_paid, valid_until, source)
- `result_stats` (id, label, value, exam, year, source, valid_until)
- `toppers` (id, full_name, name_variants text[], exam, exam_year, rank, result_date, course_id, is_minor, photo_path, consent_path, consent_date, consent_channels channel[], consent_valid_until, guardian_signed, verified_by, verified_at)
- `posters` (id, branch_id, created_by, title, channel, status, review_stage, current_version, created_at, updated_at)
- `poster_versions` (id, poster_id, version, image_path, image_sha256, caption, alt_text, tagged_topper_ids uuid[], reading jsonb, reader_model, checked_at)
- `findings` (id, version_id, rule_id, kind, severity, message, reason, evidence jsonb, suggested_fix, status, override_reason, resolved_by, resolved_at)
- `reviews` (id, poster_id, version_id, actor_id, action, comment, created_at)
- `audit_log` (id, actor_id, action, target_type, target_id, details jsonb, created_at). Every status change and every AI call goes here. For AI calls, log the model, image hash, what was sent and the time.

Every check writes a row, including passes, so the findings view can show "passed" checks too.

Row-level security (in `policies.sql`):
- Branch staff: read and write their own branch's posters and versions; read the rulebook.
- Regional managers: read posters from branches in their region.
- Head office: read and write everything, including the rulebook.
- `toppers.consent_path` is readable by head office only. The `consent` storage bucket has no client access at all; the backend uses the service role.
- Status changes and findings are written **only by the backend**, never directly by the client.

---

## 7. Poster status machine (enforce in `backend/app/state.py`)

```
create version ──► draft ──(pipeline done)──► checked
checked ──(branch submits)──► in_review [stage: regional]
in_review/regional ──(regional approves)──► in_review [stage: head_office]
in_review ──(regional or head office sends back)──► changes_requested
changes_requested ──(branch uploads new version)──► draft ──► checked ──► …
in_review/head_office ──(head office final approve)──► approved
```

Rules:
- Nobody can approve a poster they created.
- Approving at either stage is refused while any finding is `block` or `needs_human` and still `open`.
- A reviewer resolves a `needs_human` finding by confirming the reading (with a note).
- Only head office can override a `block` finding, and only with a written reason.
- AI findings are always `warn`. They never block on their own.
- Every transition writes to `reviews` and `audit_log`.

---

## 8. The check pipeline (`pipeline/run.py`)

1. **Save** the image to the `posters` bucket and compute its SHA-256.
2. **Read with Gemini** (`reader.py`):
   - One `generate_content` call per version, with the image and caption. Use JSON output with a response schema (the Pydantic model `PosterReading`) and temperature 0.
   - The model name comes from `GEMINI_MODEL`. Use a Flash model available on the free tier (check Google AI Studio).
   - Positions use Gemini's box convention: `box_2d = [ymin, xmin, ymax, xmax]` normalised 0–1000. Convert to pixels in one helper.
   - `PosterReading` contains:
     - `text_blocks`: text, romanised text, box
     - `claims`: text, box
     - `people`: name, romanised name, rank text and value, course, duration and paid text near them, box
     - `numbers`: kind (fee, phone, rank, stat, other), raw text, value, box
     - `registered_name_seen`, `helpline_seen`
     - `wording_flags`: text, box, rule_id (only `BRAND-04` or `AI-01`), why, optional suggested rewrite
   - The prompt says: extract only what is visible, never guess, use only the given rule IDs, return JSON only.
   - Validate with Pydantic. Retry up to 2 times on invalid output, then save a reader failure finding instead of crashing.
   - Reuse a saved reading if the same image hash was already read.
   - Log the call to `audit_log`.
   - `READER_MODE=fixture` loads `tests/fixtures/readings/<name>.json` instead of calling Gemini. Use this for development and tests to save quota.
3. **Second read** (`ocr.py`): for every rank, fee, phone and stat number, crop its box (8% padding), upscale 2×, grayscale and threshold, then run Tesseract with `--psm 7` and a digits whitelist. If the digits differ from Gemini's, or the number is unreadable, add a `reader` finding with severity `needs_human`.
4. **Match names** (`match.py`): use RapidFuzz `WRatio` on the romanised name against `full_name` and `name_variants`. A score of 85 or more is a match; 70–85 is `needs_human`. Compare with the staff tags: a person detected but not tagged is `needs_human`, and a person tagged but not detected is a `warn`.
5. **Visual checks** (`visual.py`):
   - Palette: k-means with k=6 in Lab colour space on a downscaled image. Ignore clusters under 5% of the area. A cluster with ΔE over 20 from every palette colour that covers 10% or more of the area is a `warn`.
   - Logo: multi-scale `cv2.matchTemplate` on grayscale; a score of 0.7 or more passes.
   - Contrast: k-means with k=2 inside each text box, then the WCAG ratio; under 4.5:1 is a `warn`.
   - Tune all thresholds on the test posters and record the final values in `docs/decisions.md`.
6. **Run the rule engine** (`rules/registry.py`): every enabled rule in `rule_pack.json` gets a context object (reading, matched toppers, tags, brand kit, courses, result stats, branch, poster channel, image) and returns findings.
7. **Save findings** and set the status to `checked`.

Suggested fixes are built by code from the register and approved facts, for example "Change the rank to AIR 73". Gemini's suggested rewrite is used only for AI findings, and is labelled as AI.

---

## 9. The 17 checks (`rules/rule_pack.json`)

| ID | Check | Kind | Fails as | How |
|---|---|---|---|---|
| CCPA-01 | No banned claims | code | block | Phrase list (built-in English, Hindi and Bengali examples plus `brand_kit.banned_phrases`), case-insensitive on text and romanised text: "100% selection", "guaranteed selection", "guaranteed rank", "100% job" |
| CCPA-02 | Every topper shown has consent on file | code | block | Matched topper has a `consent_path` |
| CCPA-03 | Consent is valid | code | block | `consent_date` after `result_date`, poster channel in `consent_channels`, not past `consent_valid_until`, `guardian_signed` if `is_minor` |
| CCPA-04 | Rank matches the register | code | block | Rank value on poster equals `toppers.rank` |
| CCPA-05 | Required details next to each topper | code | block | Rank, course name, duration and paid/free shown near each person, and true to the register |
| CCPA-06 | Results figures match approved stats | code | block | Every stat claim equals an approved `result_stats` value |
| FACT-01 | Course names and durations | code | block | Named courses match `courses` (fuzzy) with the right duration |
| FACT-02 | Fees | code | block | Every fee equals an approved course fee |
| FACT-03 | Branch contact details | code | block | Phone numbers and addresses match the branch or the helpline |
| FACT-04 | No expired facts | code | warn | Any fact used past its `valid_until` |
| BRAND-01 | Logo present | code | warn | Template match |
| BRAND-02 | Colours within palette | code | warn | Palette check |
| BRAND-03 | Registered name and helpline present | code | warn | From the reading |
| BRAND-04 | Tone of voice | ai | warn | Gemini wording flag against `tone_notes` |
| ACC-01 | Text contrast at least 4.5:1 | code | warn | Contrast check |
| ACC-02 | Alt text on social posts | code | warn | Required for `instagram` and `whatsapp`; passes for `print` |
| AI-01 | Disguised guarantees | ai | warn | Gemini wording flag, e.g. "selection pakka", "seat confirmed" |

Each rule in the JSON also has a plain-language `reason` that the UI shows next to every finding. If the AI flags something without one of the two AI rule IDs, show it as a question for the reviewer, not a finding.

---

## 10. Backend API

All routes need `Authorization: Bearer <Supabase JWT>`, except `/health`. Validate the token with Supabase, then load the profile and role.

| Method | Route | Who | Does |
|---|---|---|---|
| GET | `/health` | anyone | uptime check |
| GET | `/rules` | all | the rule pack |
| POST | `/posters` | branch staff | multipart: image, title, caption, alt_text, channel, tagged_topper_ids. Creates poster and v1, runs pipeline, returns detail |
| POST | `/posters/{id}/versions` | branch staff | new version when status is `checked` or `changes_requested`; runs pipeline |
| POST | `/posters/{id}/submit` | branch staff | `checked` → `in_review` |
| POST | `/posters/{id}/review` | regional, head office | `{action: approve \| send_back, comment}` |
| POST | `/findings/{id}/resolve` | regional, head office | confirm a `needs_human` reading, with a note |
| POST | `/findings/{id}/override` | head office | override a `block`, with a reason |
| GET | `/posters/{id}` | by role | versions, findings, reviews, signed image URLs |
| GET | `/insights` | head office | issues by branch, by rule, most-overridden rules, totals |
| POST | `/toppers/{id}/consent` | head office | upload the consent PDF to the private bucket |
| GET | `/toppers/{id}/consent-url` | head office | short-lived signed URL |

Lists (my posters, review queues) and rulebook editing go through supabase-js with row-level security. After the backend works, generate frontend types with `npx openapi-typescript <API_URL>/openapi.json -o src/api/schema.d.ts`.

---

## 11. Temporary frontend

### Pages (Round 2)
1. **Login** `/login`: three demo-account buttons plus email and password.
2. **Poster detail** `/posters/:id` (shared): the poster with numbered boxes over problems; a findings list with rule, reason, severity, code or AI, and fix; a version switcher; a compare-versions tab; comments and history. The action bar changes by role: upload fixed version, approve or send back, final approve or override.
3. **Not found / error**
4. **My posters** `/branch` (branch staff): list with status and open-issue count, and a "New poster" button.
5. **New poster** `/branch/new`: image upload with preview, caption, alt text, channel, tag toppers, "Run checks" with a progress state, then go to the detail page.
6. **Review queue** `/review` (regional manager)
7. **Final approvals** `/approvals` (head office)
8. **Brand kit** `/rulebook/brand`
9. **Courses and fees** `/rulebook/courses`
10. **Results figures** `/rulebook/results`
11. **Toppers register** `/rulebook/toppers`: table plus an edit drawer with consent upload.
12. **Rules** `/rulebook/rules`: the 17 checks with ID, reason, kind, severity and on/off.
13. **Insights** `/insights`
14. **Audit log** `/audit`

Round 3 (not now): public consent page `/consent/:token`, reliability report `/reliability`.

### Frontend rules (also put these in `frontend/AGENTS.md`)
- Animations live only in `lib/motion.ts` and `components/ui`. Use motion only to answer a person's action (opening a drawer, highlighting the finding you clicked), never as decoration.
- No hardcoded colours or sizes; use tokens from `styles/tokens.css`.
- Any new UI element goes in `components/ui` as its own file and gets reused.
- Pages do layout only. One component per file, under about 150 lines.
- Data only through `src/api/hooks`, never `fetch` inside components.
- Every page handles loading, empty and error states with the shared components.
- `npm run check` (tsc + eslint) must pass. ESLint bans Motion imports, `style=` attributes, and `animate-`, `transition` or hex-colour classes inside `src/pages`.

### Look
Follow our Round 1 PDF: warm off-white background, deep navy text and headings, red for blocked, teal for passed and approved, orange for warnings and AI findings. Use a bold serif for headings and a clean sans for body text, both from Google Fonts. Starting tokens:

```css
--paper: #F8F6F1;  --surface: #FFFFFF;  --ink: #1F3354;  --muted: #5B6B82;  --line: #D5DCE6;
--blocked: #C8472C;  --passed: #238A7D;  --warning: #D9822A;  --info: #2E6A9E;
```

It is a work tool, so the poster with its findings is the hero of the app. Use sentence case everywhere, no all-caps labels, and buttons that say exactly what they do ("Run checks", "Send back", "Approve"). Errors say what happened and how to fix it.

---

## 12. Demo data (`scripts/seed.py`, all fictional)

- **Institute:** Northfield Academy (registered name "Northfield Academy Pvt. Ltd."), with a fake helpline.
- **Region and branches:** East region, with branches in Kolkata, Siliguri, Patna and Ranchi, each with fake phone numbers and addresses.
- **Users:** create through the Supabase admin API, with the password from `DEMO_PASSWORD`.
  - `staff.siliguri@pramaan.demo` (branch staff, Siliguri)
  - `regional.east@pramaan.demo`
  - `hq@pramaan.demo`
- **Courses:**
  - 2-Year Classroom Programme: 24 months, ₹48,000, paid
  - 1-Year Crash Course: 12 months, ₹30,000, paid
  - All-India Test Series: 6 months, free
- **Result stat:** "Classroom students who qualified JEE Main 2026" = 42.
- **Toppers:**
  - Riya Sen: AIR 73, classroom, valid consent
  - Arjun Das: AIR 112, classroom, **no consent**
  - Priya Mondal: AIR 205, **test series only** (free), valid consent
  - Karan Thapa: AIR 340, crash course, **consent dated before the result**
  - Ananya Roy: AIR 58, **minor**, guardian-signed consent
- **Test posters** (`tools/make_test_posters.py`, Pillow): one clean poster, plus posters that plant each problem:
  - "100% selection guaranteed"
  - Riya shown as AIR 37
  - Arjun's photo with no consent
  - Priya presented as a classroom topper
  - fee shown as ₹45,000
  - wrong phone number
  - off-palette colours
  - low-contrast disclaimer
  - Hindi or Bengali text, including one disguised guarantee
  
  Save a matching fixture reading for each poster.

Zihan owns the test posters. If you scaffold the generator, record it in `docs/ai-disclosure.md`.

---

## 13. Environment variables

`backend/.env`
```
SUPABASE_URL=
SUPABASE_SECRET_KEY=          # service role / secret key, server only
GEMINI_API_KEY=
GEMINI_MODEL=                 # a free-tier Flash model from Google AI Studio
READER_MODE=fixture           # fixture | live
ALLOWED_ORIGINS=http://localhost:5173
TESSERACT_CMD=                # Windows only, e.g. C:\Program Files\Tesseract-OCR\tesseract.exe
DEMO_PASSWORD=                # used by scripts/seed.py
```

`frontend/.env`
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=   # anon / publishable key
VITE_API_URL=http://localhost:8000
```

---

## 14. Running locally (Windows 11)

```powershell
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest

# frontend
cd frontend
npm install
npm run dev
npm run check
```

Install Tesseract for Windows (the UB Mannheim build) with the Hindi and Bengali language data, then set `TESSERACT_CMD`. Run `supabase/schema.sql` and `policies.sql` in the Supabase SQL editor, then `python -m scripts.seed`.

---

## 15. Deployment

- **Backend on Render:** a Docker web service from `backend/`. The Dockerfile installs `tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin tesseract-ocr-ben`. Start it with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. The free instance sleeps when idle, so call `/health` a minute before any demo.
- **Frontend on Vercel:** root `frontend`, build command `npm run build`, output `dist`. Add a `vercel.json` rewrite of all routes to `/index.html`.
- **CORS:** add the Vercel URL to `ALLOWED_ORIGINS`.
- **Live mode:** set `READER_MODE=live` in production.

---

## 16. Testing

- Every code check has at least one passing and one failing test, using fixture readings. Tests make no Gemini calls.
- Test the status machine and the permission rules: no approving your own poster, no approval with open blocks, override only by head office with a reason.
- Test the box-coordinate conversion and the Tesseract comparison logic.
- Keep `docs/user-testing.md` for the classmate test sessions: who tested, the task, what broke, what we changed. Round 2 asks for this evidence.

---

## 17. Build order

Finish each phase, run its tests, commit, update **Status**, then move on.

1. **Setup:** repo structure, `.gitignore`, `.env.example` files, empty FastAPI with `/health`, Vite app, both deployed.
2. **Database:** `schema.sql`, `policies.sql`, storage buckets, `seed.py`.
3. **Rule engine on fixtures:** `rule_pack.json`, registry, all 15 code checks, tests.
4. **Pipeline:** Gemini reader (live and fixture modes), Tesseract cross-check, name matching, visual checks.
5. **API and status machine:** endpoints in section 10, permissions, audit log.
6. **Temporary frontend:** API layer and hooks first, then shared components, then pages in the order of section 11.
7. **End to end on the live link:** run the full demo flow with all three roles.
8. **Docs:** README (live links and demo accounts), architecture, decisions, AI disclosure, user testing, contributions.

---

## 18. Round 2 submission checklist

- [ ] Working product on a deployed link
- [ ] Public GitHub repo with real commit history from each member
- [ ] Architecture and the main technical decisions explained
- [ ] List of APIs, AI models, datasets, libraries and services used
- [ ] Evidence of user testing
- [ ] Each member's contribution, stated accurately
- [ ] The three Round 3 improvements named: digital consent link, 50-poster reliability tests, more formats (PDF brochures, multi-image posts, disclaimer size check)

---

## 19. How to work on this project

- Before each phase, give a short plan. After it, run the tests or `npm run check` and report what passed.
- **Ask first** before changing the database schema or API contract once the frontend uses them, adding a dependency outside section 5, or doing anything that costs money.
- Don't build Round 3 features yet.
- Prefer simple, readable code over clever code. Every team member may be asked by judges to explain it.
- If a library behaves differently from what this file says, follow the library's current docs and note the change in `docs/decisions.md`.

---

## Status

_Update this as you go: what's done, what's next, known issues._

- [x] Phase 1: setup (7 Nov). Repo on GitHub; `/health`; Vite + Tailwind + shadcn; `npm run check`; `render.yaml` and `vercel.json` ready. **Deploys still to do:** need Render and Vercel accounts.
- [x] Phase 2: database (7 Nov). Schema, policies and buckets applied to the Supabase project; seed run; `scripts/check_rls.py` passes 13/13 as the demo users. Added `rule_settings` table (see decisions.md).
- [x] Phase 3: rule engine (7 Nov). 17 rules in `rule_pack.json` (+ 3 reader checks), registry with `@rule`, all 15 code checks and 2 AI checks, name matching. 41 tests pass, each code check with passing and failing cases. Rule `reason` wording awaits Rishav's review.
- [x] Phase 4: pipeline (7 Nov). Reader (Gemini `gemini-3.5-flash` live + fixture mode, Groq backup), Tesseract second read, name matching, visual checks, `run.py`. 11 test posters with fixture readings; each fails exactly its planted check. 70 tests pass. Live Gemini and Groq both tested. **Known:** Tesseract isn't installed on Oikyo's laptop, so locally READ-02 always asks a person; it's installed in the Docker image.
- [x] Phase 5: API and status machine (7 Nov). All 12 endpoints in section 10; JWT verified with `get_claims`; status machine and permissions in `app/state.py`; every transition in `reviews` and `audit_log`. 86 tests pass; `scripts/e2e_flow.py` runs the full flow on the live database: 25/25. Live Gemini through the API works, with reuse of readings by image hash. **Known:** Gemini 3.5 Flash often returns 503 (high demand); Groq backup takes over.
- [x] Phase 6c: organisations and onboarding (7 Nov). Any company can sign up and gets an isolated workspace (`org_id` on every table, RLS "own organisation only", two-column foreign keys); migration applied to the live database. Head office adds people (temporary password, changed at first sign-in), manages branches and regions, and imports branches, courses, results, toppers and team from CSV with a line-by-line preview. Frontend redesigned again (IBM Plex, quieter, product page, setup checklist). 100 backend tests; `check_rls` 21/21 live; `e2e_flow` and `org_flow` pass against Render.
- [x] Phase 6b: final frontend (7 Nov). Revamped on the Black & Gold palette (Prussian blue ink, black midnight canvas, alabaster lines, orange for the action and the selection); light, midnight and match-the-device themes with no flash on load; optimistic updates for submit, review, confirm, override and every rulebook edit; `usePosterUpload` shows a new poster in My posters while its checks run; pages load on demand (Recharts only on Insights); phone layout with a fixed action bar and stacked table rows. New lint rule: every class on a page must be a flex, grid or gap class. Driven in a browser as all three roles, light, midnight and phone: no console errors.
- [x] Phase 6: temporary frontend (7 Nov). `src/api` contract (client, generated `schema.d.ts`, hooks); all 14 pages + login; role-based shell; `npm run check` passes. Full Round 2 flow driven through the UI in a browser as all three roles against the live database: no console errors.
- [x] Phase 7: end to end on live link (7 Nov). App https://pramaanapp.vercel.app, API https://pramaan-api-6p3b.onrender.com (Render, second account, deploys through the GitHub Actions deploy hook after tests pass). `scripts/e2e_flow.py` against the deployed API: 25/25, live Gemini reading. Login and API calls verified from the Vercel origin (CORS). Tesseract runs in the Docker image. A scheduled GitHub Action (`keep-awake.yml`) calls `/health?db=true` every 10 minutes so neither Render nor Supabase sleeps. Pramaan's own logo is now a vector (`docs/brand/`, `components/ui/BrandLogo.tsx`, favicons). **Still worth doing:** click through the whole flow in a browser on the live link as all three roles.
- [ ] Phase 8: docs. Drafted: README, architecture (with privacy), decisions, AI disclosure. **Needs the team:** classmate sessions in `user-testing.md`, each member's row in `contributions.md`, Rishav's review of the rule `reason` texts, demo video.

Known issues (7 Nov): Gemini 3.5 Flash often answers 503 (high demand), and the Groq backup takes over. Tesseract isn't installed on Oikyo's laptop, so locally every poster asks a person to confirm its numbers (READ-02). On Render, Tesseract read Riya's "73" on the clean poster as "13", so the clean poster still gets one READ-02 for a person; the second read's crop and preprocessing need tuning with Tesseract installed.