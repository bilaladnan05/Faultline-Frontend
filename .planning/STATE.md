# Frontend state

## Current focus

Phase 3 diagnosis workspace implemented as an exact-scope frontend surface. Runtime activation is blocked until the incident read contract exposes the backend revision/snapshot scope.

## Status

Active. Backend Phase 3 is implemented through Plan 03-07, while G2 remains blocked pending the human/live evidence described in `Faultline-Backend/.planning/phases/03-integrated-incident-diagnosis/03-08-PLAN.md`.

## Current acceptance criteria

- Diagnosis UI is exact-scope by incident revision and evidence snapshot.
- Authoritative diagnosis is shown only for backend-validated output.
- Stale, unavailable, invalid, partial-history, and manual-retry states are distinct.
- Evidence, blast radius, hypotheses, and citations remain bounded and inspectable.
- No UI exposes mutation, Secret, admin, or production-execution controls from the read-only diagnosis path.

## Completed in this slice

- Added a Diagnosis tab to incident detail.
- Added exact-scope investigation, citation detail, read-only `kubectl_read` test, authoritative hypothesis rendering, and provider failure messaging.
- Refused to infer scope when the backend incident response does not provide revision/snapshot identifiers.

## Validation evidence

Validation: frontend lint, build, 120 tests, agentic SDLC gate, and `git diff --check` passed. Browser user-flow verification and backend changes were not run; runtime diagnosis remains blocked on the missing scope exposure.
