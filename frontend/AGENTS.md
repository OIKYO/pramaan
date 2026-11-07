# Rules for AI tools working on the frontend

These come from the project brief (`CLAUDE.md`, section 11). `npm run check` enforces the ones a linter can.

- **`src/api/` is the stable contract.** The API client, the generated types (`schema.d.ts`) and the hooks in `src/api/hooks/` are what the final UI is built on. Don't change their shapes without asking the team.
- **Data only through `src/api/hooks`.** Never call `fetch` or `supabase` inside a component or page.
- **Pages do layout only.** They arrange components and call hooks. One component per file, under about 150 lines.
- **Any new UI element goes in `components/ui`** as its own file, and gets reused.
- **No hardcoded colours or sizes.** Use the tokens in `src/styles/tokens.css` (exposed as Tailwind classes such as `bg-paper`, `text-ink`, `text-blocked`).
- **Animations live only in `src/lib/motion.ts` and `src/components/ui`.** Use motion only to answer a person's action (opening a drawer, highlighting the finding you clicked), never as decoration.
- **Every page handles loading, empty and error states** with the shared `Skeleton`, `EmptyState` and `ErrorState` components.
- **Words:** sentence case everywhere, no all-caps labels. Buttons say exactly what they do ("Run checks", "Send back", "Approve"). Errors say what happened and how to fix it.
- **`npm run check` (tsc + eslint) must pass.** ESLint bans Motion imports outside `lib/motion.ts` and `components/ui`, and bans `style=`, `animate-`/`transition` classes and hex colours inside `src/pages`.
