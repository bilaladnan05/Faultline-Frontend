# Backend-driven frontend parity plan

## Purpose

This document is the frontend execution contract derived from the backend `.planning/` roadmap. The backend is the source of truth for API shape, lifecycle, authorization, evidence semantics, and release gates. Frontend work follows completed backend contracts; it must not invent alternate state or optimistic success states.

## Current audit

The frontend already contains usable surfaces for cluster onboarding, incident listing/detail, evidence history, telemetry, reporting, and the Phase 3 diagnosis request primitives in `src/api/endpoints.js`. It is not yet behaviorally aligned with the backend Phase 3 operator contract.

### Phase 1 — Trustworthy Signal Intake

Backend status: complete and verified.

Frontend parity status: partial.

- Existing: cluster list/onboarding and collector lifecycle screens.
- Existing: runtime telemetry and intake diagnostics API client work.
- Gap: expose source health, bounded intake diagnostics, stale/missing source state, and credential rotation/revocation outcomes in the operator workflow.
- Acceptance: an operator can see which cluster/source is healthy, late, duplicate, rejected, or missing without exposing raw payloads or secrets; all displays preserve backend tenant/project scope.

### Phase 2 — Parallel Incident Core and HolmesGPT Foundation

Backend status: complete with live runtime evidence still required before the G1/G2 operational gates are considered closed.

Frontend parity status: partial.

- Existing: incident ledger, incident detail, evidence history, telemetry queries, report views, and read-only diagnosis request helpers.
- Gap: make incident identity, evidence snapshot identity, provider availability, and read-only capability explicit in the UI; distinguish core incident availability from Holmes/provider failure.
- Acceptance: a provider outage leaves incidents and evidence usable, shows an unavailable diagnosis state, and never presents a failed provider attempt as an authoritative diagnosis.

### Phase 3 — Integrated Incident Diagnosis

Backend status: implementation complete through Plan 03-07; G2 remains blocked pending disposable-cluster evidence and human SRE/Kubernetes sign-off in Plan 03-08.

Frontend parity status: highest-priority implementation gap.

Required vertical slice:

1. Add a typed client/model boundary for the exact organization/project/cluster/incident/revision/snapshot scope.
2. Add an incident diagnosis workspace that renders immutable revision identity, material-change/stale state, and merge/split relationship metadata.
3. Render the deterministic evidence pack in backend category order: timeline, blast radius, deployment/context, source context, and missing evidence.
4. Render confirmed/likely/possible blast-radius tiers with their evidence IDs and source timestamps.
5. Render exactly the backend-authoritative three ranked hypotheses with confidence, supporting evidence, contradicting evidence, and missing evidence.
6. Make citations open bounded sanitized detail through the citation endpoint; never render raw unbounded telemetry by default.
7. Add explicit state handling for auto-trigger pending, authoritative success, provider unavailable, invalid/unresolved output, stale revision, and manual retry.
8. Add the reviewed read-only diagnostic test flow. The UI must communicate that it is reviewed/read-only and must not offer mutation, Secret, or admin operations.

Phase 3 frontend acceptance:

- Every diagnosis card identifies the exact revision and evidence snapshot it belongs to.
- A stale revision cannot be mistaken for current truth and does not silently auto-rerun.
- Only schema-valid, exact-scope, citation-resolved backend output is labeled authoritative.
- Partial telemetry history is visible as degraded history while durable incident/evidence state remains usable.
- Provider failure exposes retry/manual-action state without hiding the incident core.
- Cross-tenant or out-of-scope responses are rendered as authorization errors, not empty success.

### Phase 4 — Governed Response and Evaluation

Backend status: not started; blocked on G2.

Frontend preparation only until contracts stabilize:

- Reserve views for lifecycle timestamps, MTTA/MTTR, replay/evaluation results, failed-diagnosis withholding, immutable response proposals, approval/rejection, and audit history.
- Do not add production execution controls. The backend contract explicitly keeps proposals separate from execution.
- Use contract fixtures and backend API schemas before implementing forms or mutation actions.

### Phase 5 — Curated Memory and Release

Backend status: not started; blocked on G3.

Frontend preparation only until contracts stabilize:

- Reserve views for tenant-scoped memory search, curation, correction, retirement/deletion, explainability, outcome comparison, and release-candidate validation.
- Keep memory provenance and tenant scope visible in every result.
- Do not ship speculative retrieval or release controls before backend contracts and G3 evidence exist.

## Execution order for tomorrow

1. Read the backend Phase 3 context, validation, and Plan 03-08 gate status; do not treat blocked G2 as passed.
2. Freeze a frontend contract fixture from the backend Phase 3 Zod/API shapes.
3. Implement the Phase 3 diagnosis workspace as one vertical slice: API boundary, state model, evidence pack, hypotheses, citations, degraded states, and tests.
4. Add Phase 1 source-health/intake diagnostics visibility where it supports the same operator journey.
5. Verify against backend build/tests plus frontend lint/build/tests and the Faultline verification skill.
6. Reconcile the frontend roadmap/state and shared handoff with exact evidence, then commit each repository separately.

## Guardrails

- Backend contracts and `.planning/` verification records are authoritative.
- Ask before changing public API shape, persistence semantics, or cross-repository architecture.
- Preserve exact scope fields and bounded-detail guarantees in client code.
- Do not infer live Holmes/G2 success from static tests or mock data.
- Keep frontend planning synchronized with the backend phase and gate status.
