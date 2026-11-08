# AI disclosure

The CodeNexus rules ask teams to say where AI tools were used. This is our account.

## What the team did

- **The concept and the plan:** the problem, the workflow (branch → regional review → head office), the rule that the AI reads but never decides, and the project brief the build followed.
- **Every product and design decision:** which features to build and in what order, the multi-organisation model, rulebooks chosen by industry, the invite hierarchy and join codes, and the look of the app from Oikyo Chowdhury's sketches (palette, themes, fonts, layouts).
- **Pramaan's logo** is the team's design.
- **Infrastructure:** GitHub, Supabase, Render and Vercel set up and run by the team, including the API keys and every migration on the live database.
- **Testing on the live site**, reporting what broke, and deciding what to fix.

## Where AI tools were used

| Used as | Tool | Directed by |
|---|---|---|
| Coding assistant for the backend, rule engine, reading pipeline, database, frontend, tests, scripts, tools and documentation, and for first drafts of the rule wording and banned-phrase examples (for Rishav Nandi's review) | Claude Code (Claude Opus 5.5) | Oikyo Chowdhury |
| Writing assistant for the website text (landing page, Product, Enterprise, Privacy, Terms, Cookies), from our brief and fact-checked, and for gathering the industry list and rulebook suggestions | ChatGPT | Oikyo Chowdhury |

## How the work was checked

- 129 automated tests, with a passing and a failing case for every code check.
- Scripts that run the whole flow against the live API: `e2e_flow.py`, `org_flow.py` and `check_rls.py`.
- Walkthroughs of the live site in a browser as every role, with fixes for what they found.

## AI inside the product

See `architecture.md` (privacy). In short: Gemini reads poster images and flags wording; plain code makes every verdict; people approve.
