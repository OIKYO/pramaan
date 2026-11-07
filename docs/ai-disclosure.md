# AI disclosure

The CodeNexus rules ask us to say where AI tools wrote significant parts of the project. Each line below names the file or feature, the tool, and the team member who directed the work.

## AI used to build Pramaan

| Date | File or feature | Tool | Directed by |
|---|---|---|---|
| 2026-11-07 | Repo setup: `.gitignore`, `.env.example` files, `render.yaml`, `frontend/vercel.json` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Backend skeleton: `backend/app/config.py`, `backend/app/main.py` (`/health`), `backend/Dockerfile`, `backend/tests/test_health.py` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| 2026-11-07 | Frontend setup: Tailwind, shadcn/ui init, `frontend/eslint.config.js` (page rules), `frontend/AGENTS.md`, `src/api/client.ts` | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |

## AI inside the product

See `architecture.md` (privacy). In short: Gemini reads poster images and flags wording; plain code makes every verdict; people approve.
