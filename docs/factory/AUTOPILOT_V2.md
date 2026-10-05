# Autopilot v2 architecture

The v2 host is a sequential, checkpointed state machine. It uses small worker
contexts backed by immutable local evidence rather than conversation memory.

Core invariants:

- all production and state frames are inventoried before implementation;
- discovery work is one complete-frame task per route, not one paid task per
  section;
- `route-blueprints.json`, `component-plan.json` and `execution-plan.json` are
  created before foundation work;
- structural reuse ignores content and transient Figma identities;
- canonical routes precede state deltas;
- route/state tasks are measured by full-page acceptance;
- section repair is allowed only after a failed full-page diagnosis;
- shared chrome and components have separate ownership and final acceptance;
- workers cannot modify the engine, frozen source or thresholds;
- missing native/source data fails closed;
- all generated evidence stays in `.factory-cache`.

The principal host modules are:

- `discovery-plan.js` — complete-frame audit order;
- `structure-analysis.js` — content-independent structural signatures;
- `state-plan.js` — canonical/state matching and delta classification;
- `route-blueprint.js` — complete route compositions;
- `component-plan.js` — shared components, canonical pages and state tasks;
- `run.js` — sequencing, retries, checkpoints and gates;
- `visual.js` — deterministic full-page capture and ownership-aware diff;
- `audit-progress.js` — durable independent-review coverage.

Project-specific behavior is limited to `scripts/factory/project/` and is
created only from the current frozen snapshot. The clean repository ships
fail-closed adapter contracts rather than assumptions from a prior website.
