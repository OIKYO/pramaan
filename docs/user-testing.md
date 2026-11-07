# User testing

Round 2 asks for evidence of user testing. Record every classmate session here: who tested (first name and course is enough), the task, what broke or confused them, and what we changed. Don't fill in sessions that didn't happen.

## Classmate sessions

| Date | Tester | Role played | Task | What broke or confused them | What we changed |
|---|---|---|---|---|---|
| | | | | | |

Suggested tasks (one per role, about 10 minutes each):

1. **Branch staff:** upload `test-posters/03-wrong-rank.png` for Instagram, tag Riya Sen, find out what's wrong, then upload `01-clean.png` as the fixed version and submit it.
2. **Regional manager:** open the review queue, decide whether the poster can be approved, and send it back with a comment if not.
3. **Head office:** give final approval, open a consent file from the toppers register, and find which branch has the most open issues.

## Developer testing so far

These were run by the developers, not by users. They show the flow works; they don't replace classmate sessions.

| Date | What | Result | What we changed |
|---|---|---|---|
| 2026-11-07 | Full Round 2 flow through the UI in a browser (Edge, scripted), as all three demo users, on the live database | Passed, no console errors, after two fixes | Student tags didn't stick (a Radix checkbox inside a `<label>` toggled twice), so we switched to `<label htmlFor>`. Two findings' boxes sat exactly on top of each other, so one couldn't be clicked; they now share one box, and the rank finding points at the rank itself. |
| 2026-11-07 | Live Gemini reading through the API | Worked; Gemini returned 503 "high demand", and the Groq backup read the poster | Added one retry on 503 before the backup takes over. A loose reader box landed on plain background and caused a false contrast warning, so contrast is now measured only where a box contains text. |
| 2026-11-07 | `scripts/e2e_flow.py` (25 steps over HTTP) and `scripts/check_rls.py` (13 policy checks) | All passed | n/a |
