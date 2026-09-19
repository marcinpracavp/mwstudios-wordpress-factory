# Autopilot v2: router, capsule, shared-first, telemetry

V1 is preserved on `autopilot-v1` at the same commit as `autopilot-do-wgladu`.
Development takes place on `autopilot-v2-optimized`. No automatic Git commit, reset or deployment is performed.

## Commands and isolation

`npm.cmd run factory:autopilot -- plan` prints the v2 plan without starting workers.
`npm.cmd run factory:autopilot -- check` also checks the configured LocalWP identity.
`npm.cmd run factory:autopilot` starts v2; `npm.cmd run factory:autopilot:resume` resumes it.

V2 uses `.factory-cache/autopilot/current-v2.json`. The v1 `current.json`, runs, results and reports are retained.
Both versions use the same execution lock: two hosts cannot mutate the same project concurrently.
`FACTORY_AUTOPILOT_ROOT` explicitly selects an isolated workspace for smoke testing; ordinary runs need no override.

## Task routing

The router consumes `task.type` and/or source file types, not a pipeline stage.
Types: source-extraction, component-build, native-content, style-fix, template-fix,
interaction, refactor, visual-review, final-polish.

Each task starts with GPT-5.6 Luna. Simple CSS/PHP fixes use medium; harder work uses high.
A failed measured acceptance escalates to Terra high. Sol is reserved for final-polish.
Final review is an explicit exception to stopping at a successful cheap review: after Luna's verification
Sol performs the ultimate visual review and any safe polish itself. Terra is skipped when it is unnecessary.
Ordinary tasks that pass host checks finish at Luna. A small improvement outside acceptance is recorded,
but is not a fabricated PASS. Capacity interruptions retry the same model on explicit resume.

## Context and custom instructions

Each attempt receives `task-capsule.json`: task identity, project URL, exact selected sections/routes,
candidate edit paths, bounded source excerpts, local HTML/computed CSS when measured, expected/actual
geometry, constraints, feedback, source-record pointers and remaining budget.
Missing measurements are null/unavailable, never invented zeros. New files may require scope discovery.
Original source files stay on disk for targeted JSON-pointer/excerpt reads; their full contents are not injected.
An oversized capsule stops for task splitting rather than silently dropping source facts.

`prompt-topics.js` selects only relevant instructions. A style-fix gets core + visual + layout + checkpoint,
without native commerce/ACF/payment instructions. Discovery reads and persists one source section at a time.

Place `custom-instructions.md` or `custom-instructions.json` in the project root before init/run.
Markdown applies to all tasks. JSON keys can be `all`, operation names (`discovery`, `foundation`, etc.),
task types or task topics. Both files are supported in that order. Invalid JSON/oversized content fails
before workers launch. Init validates the files; each run snapshots their raw-byte hashes and selected content.
Changing instructions during a paused run does not silently reuse old results.

Example (synthetic smoke-test condition, not a project design fact):

```json
{"discovery":"Record the exact source FRAME width.","style-fix":"Keep the established shared grid."}
```

## Shared components and real data

Order: discovery sections → global font/grid/route skeleton → native source content → each shared
component/variant + measured gate → page/state components → scoped repairs → checkpointed audit → Sol polish.
All source card/listing products are created in native Woo before reuse. Rich text is imported only for
products that have it in source; cards retain title/image/price. Source hierarchy, tags, options, variation
prices, reviews and replaceable SVG/ACF icon fields are part of the native-content contract.
`commerce-policy.js` retains explicit-price-first proportional pricing and manual-override protection.

Pagination uses actual native record counts. `demoClones` can plan explicitly authorized source-backed
slide/post/product-card clones with stable import keys, cloneOf and provenance. It never creates orders,
reviews or transactions. Importers must store these markers and preserve editor changes.

Shared components are measured in their own local rectangle before whole pages exist: exact source frame
viewport, x/width/height, actual render, source crop, diff, image health and runtime/font readiness.
Their vertical position in the complete page is deliberately checked later by the full-page gate.
Source reference PNGs are reused from the frozen snapshot; local crops do not call Figma.
Active frames reuse canonical components; exact source-crop matches in the existing state plan exclude
unchanged sections. Distinct genuine shared variants remain separate work.

## Diagnostics and checkpoints

Node classifies identical overflow/health signatures across all measured routes as a shared diagnosis.
Different errors/viewport failures stay separate. Local geometry failures carry section IDs and actual
height/width deltas. Shared corrections precede page corrections. Raster ratios are diagnostics alongside
geometry; no blanket image masking or fabricated percent improvement is used.

Task records bind source/config/custom-instruction identity, evidence hashes and touched source files.
Evidence/output changes invalidate them. Each source section and component has a stable task identity.
The audit ledger issues one pending item at a time and retains its immutable result immediately.
`passed`, `needs_work` and `blocked` all count as audit coverage; only `passed` is acceptance.
Completed coverage is reused only with matching source/render/implementation evidence.

## Budgets and telemetry

`taskBudgets` configures maxInputTokens (including repeated cached input), maxUncachedInputTokens,
maxOutputTokens, maxAttempts and maxPromptBytes per task across
resumes. The global budget remains an additional cap. Preflight limits capsule + prompt bytes;
runtime observes exposed context/output and checks reported exact usage when the CLI completes a turn.
The CLI does not expose a hard pre-generation token cap for every internal reasoning/tool call:
reported totals may overshoot before the host can stop. Unknown interrupted usage remains unknown, not zero.
No guarantee of an exact billing ceiling is made. Small tasks, bounded reads and timeouts limit that exposure.

Each attempt has `launch.json`, `execution.json`, `usage.json`; the run has `usage.jsonl` and
`usage-summary.json`. Records include `model: luna|terra|sol`, exact model ID, effort, input/cached/output
tokens, validation state and cost. Missing usage/cost is null. Pricing is deliberately unconfigured:
optional `pricing.<alias> = {input,cachedInput,output,source}` supplies USD per million tokens and a verified
source. These are configured estimates, not subscription charges or invoices.

## Verification

`npm.cmd run factory:autopilot:test`
checks routing, scoped prompts, persisted limits, source-bound checkpoints, custom instructions, native
clone provenance, state-family deduplication and cost accounting (synthetic test rates only).
The host integration test simulates a failed shared gate and a capacity interruption, verifies that page
workers cannot run early, and resumes without repeating completed discovery/global/header work.

`node scripts/factory/autopilot/v2-smoke.js` creates an isolated, explicitly synthetic three-view fixture,
requests one real Luna CSS correction, checks a custom-instruction marker, compares 1920px screenshots
against immutable test references, checks an interactive panel and records real usage.
It does not touch the WordPress database, RudnikAgro source or site implementation.
Synthetic screenshot equality is a pipeline smoke test, not evidence of production Figma/WordPress parity.
Production acceptance still requires a complete fresh source-backed run and native integration checks.
