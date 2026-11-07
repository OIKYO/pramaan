# AI disclosure

The CodeNexus rules ask us to say where AI tools wrote significant parts of the project. Each line below names the file or feature, the tool, and the team member who directed the work.

## AI used to build Pramaan

| Date | File or feature | Tool | Directed by |
|---|---|---|---|
| 2026-11-07 | Repo setup: `.gitignore`, `.env.example` files, `render.yaml`, `frontend/vercel.json` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Backend skeleton: `backend/app/config.py`, `backend/app/main.py` (`/health`), `backend/Dockerfile`, `backend/tests/test_health.py` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Frontend setup: Tailwind, shadcn/ui init, `frontend/eslint.config.js` (page rules), `frontend/AGENTS.md`, `src/api/client.ts` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Database: `supabase/schema.sql`, `supabase/policies.sql`, `backend/app/db.py` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Demo data: `backend/scripts/seed.py`, `tools/make_logo.py` (fictional logo); RLS check `backend/scripts/check_rls.py` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | `docs/decisions.md` (first draft) | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Rule engine: `backend/app/models.py`, `backend/rules/` (registry, 15 code checks, 2 AI checks, `rule_pack.json`), `backend/pipeline/match.py`, tests in `backend/tests/` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Pipeline: `backend/pipeline/` (reader with Gemini + Groq backup, Tesseract second read, visual checks, `run.py`), `backend/tests/test_pipeline.py` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Test poster generator scaffold `tools/make_test_posters.py`, the 11 posters in `test-posters/` and their fixture readings (Zihan Sirat owns the test posters) | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | API and status machine: `backend/app/auth.py`, `app/state.py`, `app/routers/` (posters, findings, toppers, rules, insights), `tests/test_state.py`, `scripts/e2e_flow.py` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Temporary frontend (until Rudrapriyo Chatterjee's final UI arrives): `frontend/src/api/` (client, hooks), theme tokens, `components/ui` additions, `components/poster`, `components/rulebook`, `components/insights`, all pages, `routes.tsx`, `layouts/` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Docs: `README.md`, `docs/architecture.md`, `docs/decisions.md`, the developer-testing section of `docs/user-testing.md`, and the templates for `docs/contributions.md` and classmate sessions | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Deployment fixes and the keep-awake job: `ALLOWED_ORIGINS` parsing, `/health?db=true`, `.github/workflows/backend.yml` and `keep-awake.yml`, `scripts/e2e_flow.py` against the live API | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Vector logo: `tools/make_brand_assets.py` measured the team's PNG logo and rebuilt it as SVG (`docs/brand/`, favicons, `og-image.png`), and `components/ui/BrandLogo.tsx`. The logo design itself is the team's. | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Final frontend revamp (Oikyo Chowdhury chose the palette and the requirements: optimistic UI, light and midnight themes, vector assets, no gradients or decorative animation): tokens and themes, `lib/theme.ts`, optimistic updates and `usePosterUpload` in `src/api/hooks`, the layout-only lint rule, every component under `src/components`, `src/layouts`, all pages and `routes.tsx` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Rule wording: the plain-language `reason` for each rule and the built-in Hindi and Bengali banned-phrase examples are first drafts by Claude Code, to be reviewed by Rishav Nandi (rule pack owner) | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |

## AI inside the product

See `architecture.md` (privacy). In short: Gemini reads poster images and flags wording; plain code makes every verdict; people approve.
