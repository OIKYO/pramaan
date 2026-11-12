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

The API runs on Render's free tier, which sleeps after 15 idle minutes. Supabase's scheduler calls `/health?db=true` every 10 minutes to keep it awake (the last part of [schema.sql](supabase/schema.sql)); a scheduled GitHub Action ([keep-awake.yml](.github/workflows/keep-awake.yml)) does the same as a backup. The site also nudges the API awake as soon as someone opens it. If a page still says the server is waking up, wait a minute. Open `/health` a minute before a demo to be sure.

### Demo accounts (all fictional)

Password for every account: `Northfield-demo-2026`, or pick a person under **Or try the demo** on the sign-in page. The people are our team; Northfield Academy, its students and its numbers are made up. In the demo, the things that would spoil it for the next person are switched off: deleting it, changing passwords or names, and managing the team.

| Email | Role | Who |
|---|---|---|
| `staff.siliguri@pramaan.demo` | Branch staff | Rudrapriyo Chatterjee, Siliguri branch |
| `regional.east@pramaan.demo` | Regional manager | Zihan Sirat, East region |
| `hq@pramaan.demo` | Head office | Oikyo Chowdhury |
| `staff.kolkata@pramaan.demo` | Branch staff | Rishav Nandi, Kolkata branch (shows branches can't see each other's posters) |

### Try it

1. Sign in as **branch staff**, choose **New poster**, upload `test-posters/03-wrong-rank.png`, tag Riya Sen, and **Run checks**. Pramaan marks the wrong rank on the poster and suggests "Change the rank to AIR 73". **Submit for review.**
2. Sign in as the **regional manager**: approval is blocked. **Send back** with a comment.
3. As **branch staff**, **Upload fixed version** with `test-posters/01-clean.png` and submit again.
4. As the **regional manager**, confirm any reading that needs a person, then **Approve**.
5. As **head office**, **Give final approval**, then look at **Insights** and the **Audit log**.

`test-posters/` has 50 fictional posters with known answers: clean ones, several planted examples of each check, and one with two problems (see `test-posters/manifest.json`).

6. **Consent by link:** as head office, open a poster with a "no consent" finding and choose **Ask for consent by link** (or make one from the toppers register). Open the link in a private window: it shows the exact poster with the person marked. Approve it there, and the consent finding clears. Withdraw it later through the same link, and the poster goes back to its branch.
7. **More pages:** upload several images at once (a carousel) or one PDF brochure. Each page is read and checked, findings say which page they're on, and the review works as for a single poster.

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

For a new Supabase project: run `supabase/schema.sql`, then `supabase/policies.sql`, in the SQL editor, then `python -m scripts.seed` from `backend/`. Check the policies with `python -m scripts.check_rls` (21 checks, including a throwaway second organisation), the poster flow with `python -m scripts.e2e_flow`, and a new company's first hour with `python -m scripts.org_flow` (both need the API running).

Install Tesseract for Windows (the UB Mannheim build, with Hindi and Bengali data) and set `TESSERACT_CMD`. Without it, every check still runs, but each poster asks a person to confirm its key numbers.

## Round 3 improvements

1. **Digital consent portal** (`/consent/<link>`): head office sends one link per person. The student, or a parent or
   guardian for a minor, sees the exact poster with them marked, their rank and every line printed about them, where it will
   be published and until when, then approves (typing their name) or declines. Approving clears the consent findings it now
   covers. Withdrawing later, through the same link, turns the consent off and sends every poster in review or approved that
   shows them back to its branch.
2. **Reliability report** (public, [`/reliability`](https://pramaanapp.vercel.app/reliability)): the 50 test posters through
   the live AI reader, each once and ten of them three times, with nothing reused, scored per check for catch rate, false
   flags and whether repeated runs agree. It fills in as the free AI quota allows (the page says how many runs are in).
   `python -m scripts.reliability` reproduces it.
3. **More formats:** carousels of up to 10 images and PDF brochures of up to 10 pages. Each page is read and checked on its
   own, then the rules run over the whole post: a finding says which page it is on, and a disclaimer on any page counts. The
   review and approval steps are unchanged.

Not built: the disclaimer size check from our Round 2 plan.

## Docs

[Architecture](docs/architecture.md) · [Decisions](docs/decisions.md) · [AI disclosure](docs/ai-disclosure.md) · [User testing](docs/user-testing.md) · [Contributions](docs/contributions.md)
