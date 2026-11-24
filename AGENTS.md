# Faultline frontend agent guide

Before working, read the workspace-level `../.ai/handoff.md`, `../.ai/task-state.md`, and `../.ai/decisions.md`, then inspect this repository's README and package scripts.

Keep frontend changes inside this repository unless a cross-repository contract change is explicitly recorded in `../.ai/decisions.md`. At handoff, update the workspace-level `.ai` files with changed files, API or UI contract changes, tests, risks, blockers, and exact Git state.

## User workflow preferences

- Move quickly with reasonable validation; ask before major architectural changes or when genuinely unsure.
- Use GSD for non-trivial work and synchronize planning state with the backend when a shared contract changes.
- From `Faultline_frontend/`, run `npm run lint`, `npm run build`, and `npm test`, then run the applicable PStack verification skill. Run PStack `no-comments` on the relevant diff when available.
- Use `.github/skills/faultline-verification/SKILL.md` for the complete frontend verification sequence.
- When complete and verified, commit, push, create or update the GitHub pull request, and verify it. Keep this repository's Git history separate from the backend repository.
- For non-trivial design work, invoke PStack `architect`; use PStack `arena` when the design is large or contested. Keep durable cross-repository decisions in `../.ai/decisions.md`.
