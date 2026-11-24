---
name: faultline-verification
description: Verify Faultline changes across frontend behavior, lint, tests, API contracts, planning evidence, and provider handoff state.
---

# Faultline verification

Use this skill after implementation, before handoff, and before declaring a task complete. Verify behavior and integration, not only compilation.

## Preconditions

1. Read the workspace `../.ai/handoff.md`, `../.ai/task-state.md`, and `../.ai/decisions.md`.
2. Read `AGENTS.md` and the frontend README.
3. Inspect Git status and identify unrelated changes. Do not modify or revert them.
4. Identify changed routes, components, API clients, state flows, accessibility behavior, and backend contracts.

## Verification sequence

Run from `Faultline-Frontend/Faultline_frontend/`:

1. `npm run lint`
2. `npm run build`
3. `npm test`
4. `npm run verify:agentic-sdlc`
5. Run targeted tests for changed behavior.
6. Exercise the affected user flow when a browser or preview environment is available.
7. Run the PStack `no-comments` skill on the changed diff when available.
8. Use PStack `prove-it-works`, `correct`, or the established verification skill for behavior-level review when available.

## Review gates

Confirm each applicable gate:

- Lint, build, and tests pass.
- Loading, empty, success, error, and retry states are handled where applicable.
- API request/response shapes match the backend contract.
- Authentication, tenant, project, and permission boundaries are not bypassed.
- Destructive actions require the intended confirmation and error handling.
- Accessibility, responsive layout, and keyboard behavior remain usable.
- Planning state and shared handoff evidence match the implementation.

## Reporting

Record every command and result. For unavailable checks, explain why and do not claim success by substitution. Update `../.ai/handoff.md` and `../.ai/task-state.md` with changed files, contracts, validation, risks, blockers, and Git state.

Example report:

```text
Lint: PASS — npm run lint
Build: PASS — npm run build
Tests: PASS — npm test (N tests)
User flow: PASS/SKIPPED — <flow and reason>
PStack no-comments: PASS — no accepted findings
Remaining risk: <short factual statement>
```
