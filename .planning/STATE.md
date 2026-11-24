# Frontend state

## Current focus

Backend-driven parity audit completed. The next implementation slice is the Phase 3 diagnosis workspace, followed by the narrower Phase 1 intake/source-health visibility gaps.

## Status

Ready for implementation. Backend Phase 3 is implemented through Plan 03-07, while G2 remains blocked pending the human/live evidence described in `Faultline-Backend/.planning/phases/03-integrated-incident-diagnosis/03-08-PLAN.md`.

## Current acceptance criteria

- Diagnosis UI is exact-scope by incident revision and evidence snapshot.
- Authoritative diagnosis is shown only for backend-validated output.
- Stale, unavailable, invalid, partial-history, and manual-retry states are distinct.
- Evidence, blast radius, hypotheses, and citations remain bounded and inspectable.
- No UI exposes mutation, Secret, admin, or production-execution controls from the read-only diagnosis path.

## Validation evidence

No implementation validation has been run for this planning-only update. Existing frontend validation remains the baseline until the Phase 3 slice changes code.
