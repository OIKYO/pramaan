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
| 2026-11-07 | Rule wording: the plain-language `reason` for each rule and the built-in Hindi and Bengali banned-phrase examples are first drafts by Claude Code, to be reviewed by Rishav Nandi (rule pack owner) | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |

## AI inside the product

See `architecture.md` (privacy). In short: Gemini reads poster images and flags wording; plain code makes every verdict; people approve.
