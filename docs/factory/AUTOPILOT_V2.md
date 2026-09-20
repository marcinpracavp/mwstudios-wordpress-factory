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

Ordinary tasks start with GPT-5.6 Luna: medium for CSS/PHP, high for larger tasks.
Task classes (css-fix, php-fix, product-import, content-import, listing-bind, global-css,
local-section, unavailable-state) select the task type independently of the pipeline stage.
Failed measured repairs escalate Luna -> Terra; successful cheap work stops immediately.
State preparation and minor fixes reported by Sol stay on Luna.

Sol high runs once at the end, after build/capture/compare and the checkpointed audit.
Above 2.5% effective mismatch it receives pixel-perfect mode; otherwise verification mode.
A durable final-sol.json stores its result. Minor spacing/overflow issues go to bounded Luna
repairs, followed by a fresh build and capture. Major unresolved issues require manual review.
An interrupted final audit resumes the same saved thread; an unidentifiable session is blocked
rather than silently creating another Sol audit. READY/complete requires all checks and <=2.5%.

## Context and custom instructions

Each attempt receives `task-capsule.json`: task identity, project URL, exact selected sections/routes,
candidate edit paths, bounded source excerpts, local HTML/computed CSS when measured, expected/actual
geometry, constraints, feedback, source-record pointers and remaining budget.
Missing measurements are null/unavailable, never invented zeros. New files may require scope discovery.
Original source files stay on disk for targeted JSON-pointer/excerpt reads; their full contents are not injected.
An oversized capsule stops for task splitting rather than silently dropping source facts.

`prompt-topics.js` selects only relevant instructions. A style-fix gets core + visual + checkpoint,
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
component/variant + measured gate → page/state components → scoped repairs → checkpointed audit → one final Sol audit.
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
tokens, validation state and cost. Missing usage/cost is null. Pricing is configured from the official OpenAI API price table (2026-09-19):
`pricing.<alias> = {input,cachedInput,output,source}` supplies USD per million tokens and a verified
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

## Bounded content and runtime resume

Products import in batches of at most three; listing relations bind separately in batches of three.
Other content is section-scoped with at most 24 records / approximately 6 KB per batch. Each batch
has a fresh model context, maxUncachedTokens=100000 (uncached input plus output), output cap 12000,
and its own source-bound checkpoint. The source snapshot is reused locally.

The worker implements project-owned scripts/factory/project/native-batch.js: async verifyBatch
({kind,records,keys,readOnly}) queries current native records and returns {readOnly:true,records:
[{key,passed,observed:{...actual values...}}]}. The host checks every assigned key before importing
and after worker completion. Correct native data skips another paid import even when the importer
code changed. Missing, duplicate, extra or unverified records cannot pass. The adapter must compare
actual WordPress values with source facts, preserve editor overrides and never mutate in verification.

## Visual decisions and photo noise

A shared overflow at all measured routes becomes one global CSS task with the affected widths.
Incomplete viewport coverage cannot prove a global problem. Empty/viewport-only content against
a much taller reference routes to state preparation before CSS. A local height delta above 50px
without overflow targets that section. JavaScript/HTTP failures are not classified as CSS.

Reference assets are cached. Image exceptions require exact source-file byte identity and bounded
high-frequency raster differences (8px tiles, mean RGB delta <=2, maximum channel delta <=40).
A four-pixel border stays measured. Raw diff and effective layout ratio are retained separately.
Wrong/unknown images and gross crop/colour/geometry errors stay failures. This conservative test
does not exempt all photo pixels; transformed source media may remain unverified. It is used by
both full-page and component comparisons. Reused header/footer owners are excluded from the
final ratio on subsequent routes; their representative checks remain mandatory.

Costs use Standard short-context API-equivalent rates, not Codex subscription billing; tool costs,
cache-write surcharges, long-context/fast/regional uplifts are excluded. Source:
https://developers.openai.com/api/docs/pricing . Each invocation records model, actual thread identity,
usage and estimated cost. Interrupted missing usage stays null. CLI-observed byte limits are
conservative guards, not a guarantee that hidden reasoning cannot exceed a reported token cap.

For a bounded native smoke use npm.cmd run factory:autopilot:resume -- --native-batch-limit 1.
The host validates/imports at most one native batch, persists its checkpoint, then pauses before the next.
Exposed-context byte guards are independent of token limits: default 400KB aggregate / 64KB single
tool result. A completed over-budget read-only final result is recovered only when persisted before/after
engine, implementation, source and init guards match; fresh final acceptance still follows.
