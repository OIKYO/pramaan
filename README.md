<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/pramaan-logo-dark.svg">
  <img alt="Pramaan: trust and verification" src="docs/brand/pramaan-logo-light.svg" width="380">
</picture>

# Pramaan

Pramaan checks every poster made by the branches of a multi-branch organisation before it is published. Our demo is a fictional coaching institute chain, **Northfield Academy**.

Branch staff upload a poster. Pramaan reads it, runs **17 checks** (15 in plain code, 2 by AI) against head office's brand kit, approved facts, a consent-backed toppers register and a rule pack based on the **CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024**, and shows each problem on the poster with the rule it breaks and a suggested fix. A regional manager reviews it, then head office gives final approval. **The AI never approves anything.**

Team **HEISEN-DE-BUG** · CodeNexus India 2026 (We Code Coders) · problem statement: Brand Governance by Inkloom AI.

## Live demo

- App: **https://pramaanapp.vercel.app**
- API: https://pramaan-api-6p3b.onrender.com ([`/health`](https://pramaan-api-6p3b.onrender.com/health), [API docs](https://pramaan-api-6p3b.onrender.com/docs))

The API runs on Render's free tier, which sleeps when idle. A scheduled GitHub Action ([keep-awake.yml](.github/workflows/keep-awake.yml)) calls it every 10 minutes to keep it awake; if a request still waits about a minute, the API was asleep. Open `/health` a minute before a demo to be sure.

### Demo accounts (all fictional)

Password for every account: `Northfield-demo-2026`. The login page also has one-click buttons.

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

## How it works

The AI reads; plain code decides; people approve. Details in [docs/architecture.md](docs/architecture.md), and the reasoning behind each choice in [docs/decisions.md](docs/decisions.md).

```
frontend/   React + Vite + Tailwind + shadcn/ui (temporary UI; src/api/ is the stable contract)
backend/    FastAPI: app/ (API, auth, status machine), pipeline/ (read, second read, match, visuals), rules/ (17 checks)
supabase/   schema.sql, policies.sql
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

For a new Supabase project: run `supabase/schema.sql`, then `supabase/policies.sql`, in the SQL editor, then `python -m scripts.seed` from `backend/`. Check the policies with `python -m scripts.check_rls`, and the whole flow with `python -m scripts.e2e_flow` (needs the API running).

Install Tesseract for Windows (the UB Mannheim build, with Hindi and Bengali data) and set `TESSERACT_CMD`. Without it, every check still runs, but each poster asks a person to confirm its key numbers.

## Round 3 improvements

1. **Digital consent link:** students and guardians give consent through a link instead of a paper form.
2. **50-poster reliability tests:** a larger poster set to measure how often each check is right.
3. **More formats:** PDF brochures, multi-image posts, and a disclaimer size check.

## Docs

[Architecture](docs/architecture.md) · [Decisions](docs/decisions.md) · [AI disclosure](docs/ai-disclosure.md) · [User testing](docs/user-testing.md) · [Contributions](docs/contributions.md)
