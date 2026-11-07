# Architecture

Pramaan checks every poster made by Northfield Academy's branches before it is published. Branch staff upload a poster; Pramaan reads it, runs 17 checks against head office's rulebook and the CCPA coaching-advertising guidelines, and shows each problem on the poster with a suggested fix. A regional manager reviews it, then head office gives final approval. **The AI reads; plain code decides; people approve.**

## The parts

```
React + Vite (Vercel)
   │  supabase-js: sign-in, poster lists, rulebook reads and edits   (row-level security applies)
   │  fetch + Supabase access token: checks, review actions, consent files, insights
   ▼
FastAPI (Render, Docker)
   ├─ app/auth.py         verifies the access token (ES256, project keys), loads the profile and role
   ├─ app/state.py        the status machine and permission rules (pure functions)
   ├─ app/routers/        posters, findings, toppers, rules, insights
   ├─ pipeline/reader.py  Gemini: one call per poster version -> strict JSON (Groq as a backup reader)
   ├─ pipeline/ocr.py     Tesseract: second read of ranks, fees, phone numbers and figures
   ├─ pipeline/match.py   RapidFuzz: names on the poster <-> toppers register, compared with staff tags
   ├─ pipeline/visual.py  OpenCV: palette (k-means in Lab), logo (template match), text contrast (WCAG)
   └─ rules/              15 code checks + 2 AI checks, driven by rules/rule_pack.json
   ▼
Supabase: Postgres (+ row-level security), Auth, Storage
   ├─ bucket posters   private; images shown through signed URLs
   ├─ bucket consent   private; no client access at all; head office gets 2-minute signed URLs via the backend
   └─ bucket brand     public; the logo only
```

## What happens when a poster is uploaded

1. **Save.** The image goes to the `posters` bucket; its SHA-256 is recorded.
2. **Read.** Gemini (`gemini-3.5-flash`) gets the image and the caption, a JSON schema (`PosterReading`) and temperature 0. It returns every text line, the claims, the people shown with their rank, course, duration and paid/free text, every key number, whether the registered name and helpline are printed, and wording flags for exactly two rules (AI-01, BRAND-04). Invalid output is retried twice; if Gemini is down, the backup reader (Groq, `qwen/qwen3.8-27b`) gets the same prompt. A reading is reused when the same image and caption were read before. In development and tests, `READER_MODE=fixture` uses saved readings instead.
3. **Second read.** Tesseract re-reads every rank, fee, phone number and figure from its box (digits only). If the two readers disagree, or the number can't be read, a person confirms it.
4. **Who is shown.** Names are matched to the toppers register (RapidFuzz: 85+ match, 70–85 asks a person) and compared with the students staff tagged. Pramaan never recognises faces.
5. **Pixels.** Palette, logo and text contrast are measured.
6. **Rules.** Every enabled check runs and returns findings with the rule, its reason, the evidence (and box) and a fix built from the register or approved facts. Every check writes a row, passes included.
7. **Status.** The version is marked checked. Branch staff submit it; a regional manager approves or sends it back; head office gives final approval or overrides a blocking finding with a reason. Approval is refused while any blocking or needs-a-person finding is open. Every step is written to `reviews` and `audit_log`.

## Security

- The browser holds only the publishable key. Row-level security decides what each person reads: branch staff their branch's posters, regional managers their region's, head office everything. Only head office can edit the rulebook.
- Posters, versions, findings, reviews and the audit log can't be written by any client. Only the backend writes them, with the secret key, and the backend repeats the visibility rule itself because that key bypasses row-level security.
- `toppers.consent_path` is withheld from every client by a column grant; consent files are reachable only through the backend, for head office, through links that expire after 2 minutes.
- `backend/scripts/check_rls.py` signs in as the demo users and checks these rules against the live database (13 checks).

## Privacy

- **Gemini free tier:** Google may use inputs sent through the free tier to improve its models. That is one reason every person, institute, phone number and address in the demo is fictional. A real deployment should use a paid tier with data-use terms that fit.
- **What goes to the AI:** only the poster image and its caption. Consent files never go to any AI.
- **No face recognition.** Staff tag the students shown; untagged or uncertain people go to a reviewer.
- **Every AI call is in the audit log** with the model, the image's hash, what was sent and when.

## Reliability

- **Same poster, same result.** Verdicts are plain code; k-means uses a fixed seed; readings are reused by image hash.
- **Nothing is skipped silently.** If the reader fails, the version gets a `READ-01` finding for a person; if Tesseract is missing, `READ-02` says so; if the image analysis doesn't run, the logo, palette and contrast checks say "couldn't check" instead of passing.
- **Tests:** 86 backend tests (every code check passing and failing, all 11 test posters end to end, the status machine and permissions, OCR comparison, box conversion, reader retries). `scripts/e2e_flow.py` runs the full Round 2 flow over HTTP as the demo users (25 checks).

## APIs, models, data, libraries and services

| Kind | What | Used for |
|---|---|---|
| AI model | Google Gemini `gemini-3.5-flash` (free tier, via `google-genai`) | Reading posters; wording flags (AI-01, BRAND-04) |
| AI model | Groq `qwen/qwen3.8-27b` (OpenAI-compatible API) | Backup reader when Gemini fails |
| OCR | Tesseract (eng, hin, ben), via `pytesseract` | Second read of key numbers |
| Libraries (backend) | FastAPI, Pydantic v2, RapidFuzz, OpenCV (headless), Pillow, NumPy, supabase-py, httpx, pytest | API, validation, matching, image checks, database, tests |
| Libraries (frontend) | React, Vite, TypeScript, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query, supabase-js, Motion, Recharts, openapi-typescript, sonner, lucide-react | UI |
| Services | Supabase (Postgres, Auth, Storage), Render (API), Vercel (frontend), GitHub | Hosting and data |
| Data | Fictional demo data only (`backend/scripts/seed.py`, `tools/make_test_posters.py`); rule content based on the CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024 | Demo and tests |
| Fonts | Source Serif 4, Source Sans 3 (Google Fonts); Nirmala UI (Windows) for the test posters | UI and test posters |
