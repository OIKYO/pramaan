<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/pramaan-logo-dark.svg">
  <img alt="Pramaan: trust and verification" src="docs/brand/pramaan-logo-light.svg" width="380">
</picture>

# Pramaan

Pramaan checks every poster made by the branches of a multi-branch organisation before it is published. Any organisation can sign up and gets its own private workspace; our demo is a fictional coaching institute chain, **Northfield Academy**.

Branch staff upload a poster. Pramaan reads it, runs up to **27 checks** (25 in plain code, 2 by AI) in the rulebooks the organisation keeps: its brand kit, approved facts, a consent-backed register of people, dates, offers, permissions and disclaimers, and for coaching institutes the **CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024**, and shows each problem on the poster with the rule it breaks and a suggested fix. A regional manager reviews it, then head office gives final approval. **The AI never approves anything.**

Team **HEISEN-DE-BUG** · CodeNexus India 2026 (We Code Coders) · problem statement: Brand Governance by Inkloom AI.

## Live demo

- App: **https://pramaanapp.vercel.app**
- API: https://pramaan-api-6p3b.onrender.com ([`/health`](https://pramaan-api-6p3b.onrender.com/health), [API docs](https://pramaan-api-6p3b.onrender.com/docs))

The API runs on Render's free tier, which sleeps after 15 idle minutes. Supabase's scheduler calls `/health?db=true` every 10 minutes to keep it awake ([2026-11-08d_keep_awake.sql](supabase/migrations/2026-11-08d_keep_awake.sql)); a scheduled GitHub Action ([keep-awake.yml](.github/workflows/keep-awake.yml)) does the same as a backup. The site also nudges the API awake as soon as someone opens it. If a page still says the server is waking up, wait a minute. Open `/health` a minute before a demo to be sure.

### Demo accounts (all fictional)

Password for every account: `Northfield-demo-2026`. Sign in with these on the login page; the public pages no longer link to the demo.

| Email | Role | Who |
|---|---|---|
| `staff.siliguri@pramaan.demo` | Branch staff | Tara Ghosh, Siliguri branch |
| `regional.east@pramaan.demo` | Regional manager | Vikram Bose, East region |
| `hq@pramaan.demo` | Head office | Meera Iyer |
| `staff.kolkata@pramaan.demo` | Branch staff | Rahul Sarkar, Kolkata branch (shows branches can't see each other's posters) |

### Try it

1. Sign in as **branch staff**, choose **New poster**, upload `test-posters/03-wrong-rank.png`, tag Riya Sen, and **Run checks**. Pramaan marks the wrong rank on the poster and suggests "Change the rank to AIR 73". **Submit for review.**
2. Sign in as the **regional manager**: approval is blocked. **Send back** with a comment.
3. As **branch staff**, **Upload fixed version** with `test-posters/01-clean.png` and submit again.
4. As the **regional manager**, confirm any reading that needs a person, then **Approve**.
5. As **head office**, **Give final approval**, then look at **Insights** and the **Audit log**.

`test-posters/` has one clean poster and ten posters that each plant one problem (see `test-posters/manifest.json`).

### Start your own organisation

1. Open the app and choose **Create organisation**. Say what your organisation does: search 30 industries and 500-odd kinds of organisation, or type your own. You become its head office.
2. Your industry suggests **rulebooks**, and Pramaan uses its words: a coaching institute keeps "Courses and fees" and a "Toppers register"; a restaurant keeps "Menu and prices". Head office adds or removes rulebooks on the **Rulebooks** page; checks in a rulebook you don't keep never run.
3. **Overview** shows a setup checklist that follows your rulebooks: brand kit (name, helpline, logo, colours), branches, what you offer and its prices, the people posters may show, approved figures and your team.
4. **Import data** takes the spreadsheets you already keep (CSV): download a template, upload, and see every change and every problem by line and column before anything is saved. Exports from each rulebook page use the same columns, so they import back.
5. **Bring people in** with an invite link (head office invites anyone; regional managers invite branch staff in their region; a link works once and expires after 7 days), or give them the organisation's join code, which they enter while creating their account. Head office sees the code on Organisation › Profile and can replace it.
6. **Team** also adds people directly with a role and a branch or region. Each gets a temporary password, shown once, and must choose their own at first sign-in. Head office can reset passwords and remove access.

Each organisation sees only its own data: every table carries `org_id` and every row-level-security policy starts with "your organisation only".

## How it works

The AI reads; plain code decides; people approve. Details in [docs/architecture.md](docs/architecture.md), and the reasoning behind each choice in [docs/decisions.md](docs/decisions.md).

```
frontend/   React + Vite + Tailwind + shadcn/ui; src/api/ is the contract every screen is built on
backend/    FastAPI: app/ (API, auth, status machine), pipeline/ (read, second read, match, visuals), rules/ (27 checks in 11 rulebooks)
supabase/   schema.sql, policies.sql, migrations/ (for databases created before organisations)
tools/      make_test_posters.py, make_logo.py
docs/       architecture, decisions, AI disclosure, user testing, contributions
```

## Run locally (Windows 11)

```powershell
# backend (Python 3.12)
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env          # fill in Supabase, Gemini and DEMO_PASSWORD
uvicorn app.main:app --reload --port 8000
pytest

# frontend
cd frontend
npm install
copy .env.example .env          # Supabase URL and publishable key, API URL
npm run dev
npm run check
```

For a new Supabase project: run `supabase/schema.sql`, then `supabase/policies.sql`, in the SQL editor, then `python -m scripts.seed` from `backend/`. Check the policies with `python -m scripts.check_rls` (21 checks, including a throwaway second organisation), the poster flow with `python -m scripts.e2e_flow`, and a new company's first hour with `python -m scripts.org_flow` (both need the API running).

Install Tesseract for Windows (the UB Mannheim build, with Hindi and Bengali data) and set `TESSERACT_CMD`. Without it, every check still runs, but each poster asks a person to confirm its key numbers.

## Round 3 improvements

1. **Digital consent link:** students and guardians give consent through a link instead of a paper form.
2. **50-poster reliability tests:** a larger poster set to measure how often each check is right.
3. **More formats:** PDF brochures, multi-image posts, and a disclaimer size check.

## Docs

[Architecture](docs/architecture.md) · [Decisions](docs/decisions.md) · [AI disclosure](docs/ai-disclosure.md) · [User testing](docs/user-testing.md) · [Contributions](docs/contributions.md)
