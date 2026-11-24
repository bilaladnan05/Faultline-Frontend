# Faultline repository control plane

This versioned directory is the clean-clone fallback for the workspace-level `.ai/` control plane. Keep its schemas and policy references synchronized with the workspace files; use the workspace-level files for live task state when available.

- `handoff.md` — durable handoff shape and required fields.
- `task-state.md` — durable task-state shape and required fields.
- `decisions.md` — cross-agent decision log format.
- `elephant-goldfish.md` — bounded Goldfish role and review rules.
- `status.schema.json` — machine-readable completion status.
