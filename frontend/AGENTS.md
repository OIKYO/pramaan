# Rules for anyone (and any AI tool) working on the frontend

`npm run check` (tsc + ESLint) enforces the ones marked ✓.

1. **Never write animation code outside `src/lib/motion.ts` and `src/components/ui`.** ✓ Motion answers a person's action (switching the theme, opening a panel, finding the problem they clicked). No hover lifts, entrance fades on load, looping effects or gradients.
2. **Never hardcode colours or sizes; use tokens only.** Every colour, for both the light and the midnight theme, is a variable in `src/styles/tokens.css`, exposed as Tailwind classes (`bg-surface`, `text-ink`, `border-line`, `bg-primary`, `text-blocked`...). Use Tailwind's spacing scale, not arbitrary pixel values.
3. **If a new UI element is needed, add it to `components/ui` as its own file and reuse it.** Feature pieces go in `components/poster`, `components/rulebook`, `components/insights`, `components/audit` or `components/auth`.
4. **Pages do layout only, with no styling beyond flex, grid and gap.** ✓ A page arranges components and calls hooks. `style=` is banned in pages, and every class on a page must be a flex, grid or gap class.
5. **One component per file, under about 150 lines.**
6. **Data comes only from `src/api/hooks`, never a fetch inside a component.** ✓ `fetch` and the Supabase and API clients may only be used inside `src/api`.
7. **Every screen uses the shared loading, empty and error states** (`QueryState`, or `LoadingRows`, `EmptyState` and `ErrorState` from `components/ui/States`).
8. **Before writing, list the files you'll touch, and touch nothing else.**
9. **Run `npm run check` and fix every error before finishing.**
10. **One typeface, no monospace.** ✓ Mona Sans everywhere; numbers use `tabular-nums`. `font-mono` is banned by lint.
11. **Use the organisation's words.** Rulebook labels come from `useVocabulary()` ("Courses and fees" for a coaching institute, "Menu and prices" for a restaurant), and rulebook screens appear only when `useKeeps()` says the organisation keeps that rulebook. Never hardcode "course", "fee" or "topper" in shared screens.

## Also

- **`src/api/` is the contract.** The client, the generated types (`schema.d.ts`) and the hooks are what every screen is built on. Changes that need a person to wait (submit, approve, send back, confirm, override, rulebook edits) update the screen at once and roll back if the server refuses (`hooks/optimistic.ts`).
- **Both themes, always.** Check every change in light and midnight. The theme is chosen in one place in Settings and one Theme entry in the account menu; don't add other theme switches. Midnight has no blue: onyx greys, an off-white primary button and a matte sand accent. Icons are Lucide (vector) and the logo is `components/ui/BrandLogo` (vector), so both follow the theme.
- **Words:** sentence case everywhere, no all-caps labels. Buttons say exactly what they do ("Run checks", "Send back", "Approve"). Errors say what happened and how to fix it.
