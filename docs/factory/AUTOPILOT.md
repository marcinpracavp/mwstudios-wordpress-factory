# Autopilot: init → snapshot → build → audit → correct → final

The runner launches **sequential** Codex sessions with explicit stage models: **gpt-5.6-terra high**
for source discovery, foundation, implementation and corrections; **gpt-5.6-sol high** only for
the later independent pixel-perfect audit and its final report. Astra is reserved for the supervising chat.
Global discovery is followed by a separate detail session per buildGroup. Interrupted sessions
resume their exact thread only when the model matches. A model change starts a fresh session with a
compact artifact handoff and current gate results, avoiding the previous model's conversation history.
Unrelated stages start fresh. Successful structured Figma observations
are persisted automatically and recovered from existing logs after a capacity pause. Invalid or
incomplete log records are explicitly rejected; they never become design facts.
It builds from the current `factory/project.json` only. No brand, URL, page list, source node,
source image or WordPress ID is hardcoded into the runner. This checkout is initialized for
RudnikAgro on `https://autopilot.local`. Old themes are not runtime dependencies.

## Run

```powershell
npm.cmd run factory:init
npm.cmd run factory:autopilot:check
npm.cmd run factory:autopilot
```

Keep the terminal/host running. For detached Windows execution use a hidden process and redirect
stdout/stderr to files. No polling agent is needed: the Node host waits for each Codex process
to exit, validates artifacts, and starts the next task. Progress can be read every 5–10 minutes:

```powershell
npm.cmd run factory:autopilot:status
npm.cmd run factory:autopilot:stop
npm.cmd run factory:autopilot:resume
```

`stop` finishes the current worker and pauses before the next task. Ctrl+C terminates the owned
worker tree and retains its partial files/logs. `resume` preserves completed stages and continues
the same run. It refuses a changed init identity or an active parent/worker. Failed runs remain
visible, with a `REPORT.md` that explicitly says `Ready for human review: NO`.

`factory:autopilot -- plan` prints the configuration without creating a site or starting a worker.
`check` reads the actual LocalWP home option and verifies it matches the configured host.

## Prerequisites and limits

The local WordPress site must be running. Codex must be signed in, with a model supported by its
installed native executable. The runner selects the newest available native Codex binary on PATH;
`FACTORY_CODEX_PATH` can explicitly select one. `factory/autopilot.json` declares `stageModels`.
The runner validates the Terra/Sol high policy before launch and never inherits a model from the
supervising chat or user config. Each attempt records its exact model, effort and CLI arguments
in `launch.json`, plus model/effort in status and execution evidence. No model is silently substituted.

Workers use workspace-write plus automatic approval review and the current site's plugins/uploads
directories. Approval review can reject an operation; the worker must report that exact blocker.
The runner never disables the sandbox or bypasses approvals. Launch the host with network access.
Only the Figma MCP is configured in child sessions, avoiding unrelated app/tool context.
Existing Figma MCP OAuth is reused. Original REST exports can additionally use `FIGMA_TOKEN` from
the host environment. Tokens are never stored in project files, prompts or report output.

The defaults allow 180 minutes per session, two attempts for an incomplete build/discovery,
four visual correction rounds, and 6 million uncached input + output tokens across completed
sessions. Cached input is recorded separately. Failed sessions may omit usage telemetry; the report
marks it unknown and the observed counter is then only a lower bound, not a guaranteed spending cap.
A budget is an upper guard on reported usage, not a quality target.
Infrastructure errors pause immediately instead of burning repair attempts in blind retries.
The parent does not spend model tokens while a worker is running. Full JSONL remains on disk.

### Bounded source context

Before each worker the host writes `source-context/index.json`, a scoped route/section/observation
index, and separate per-section records containing exact original content. Every source file and
projection carries its byte count and SHA-256. These are task views, not a replacement snapshot;
the full original records remain authoritative and untouched. Missing observation-index matches
never prove that source is unavailable. Shared sections remain included in each route's scope.

Workers start with the handoff/index instead of dumping the global manifest or content-map.
`node scripts/factory/autopilot/source-context.js inspect <file> [JSON-pointer] [character-offset]`
prints at most 6000 source characters with an explicit continuation offset. Narrowing to a key or
array index avoids repeated full reads. Large source files can still be parsed/updated on disk.
CLI `tool_output_token_limit=3000` limits retained individual tool outputs; source facts omitted
from a bounded view must be read explicitly before certifying completeness. It is not a total
session token cap. The limit applies to retained output, not the original evidence bytes on disk.

A context-policy change starts a fresh worker with saved artifacts instead of resuming an old,
oversized conversation. Later capacity interruptions under the same model/context policy can
resume their thread and retain cache. `launch.json` records the policy version and output limit.

## Source snapshot / execution contract

Extend the existing `factory/schemas/figma-snapshot.schema.json` and section snapshot format.
Do not create a parallel source plan. Schema fields:

- `pages`: every actual Figma PAGE, with purpose.
- `frames`: every referenced production/section/component node, with page identity.
- `productionFrames`: every top-level candidate frame, actual `nodeId`, `name`, `classification`
  (`production`, `state`, `archive`, `research`, `component`) and a source-grounded `reason`.
- `routes`: every production frame/state mapped to an executable route. Required keys are `id`,
  `path` (local relative path), `language`, `frameNodeId`, `reference` (snapshot-relative PNG),
  `width` and `height` (exact full source frame pixels), `sections` (ordered IDs), `buildGroup`
  (related native template/page family), and `responsiveSource` (`figma` or `derived`).
  Optional `state` names an actual UI state; `notes` explains its source; `sectionGeometry`
  maps shared section IDs to measured x/y/width/height in this route. A mobile Figma frame
  is its own source route entry at its real width, grouped with its desktop page.
- `sections`: globally unique section IDs with continuous inventory order, source node identity,
  compact JSON path and actual desktop reference. Reuse shared sections where geometry permits.
  Section `desktop` geometry is relative to the full production frame, never the Figma canvas.
  Fractional node dimensions are preserved. References are actual 1x PNG files.
- Omit `mobile`/`mobileNodeId`/`mobileReference` when no source exists. A mobile node/reference
  pair must be complete when present. Derived responsive is not source geometry or source copy.
- `content-map.json`: object containing `fields`, an array of actual content records with
  `section`, `nodeId`, `fieldName`, `type`, `language`, and `value`. `value` can contain
  exact text or structured sourced content. Add source-based native content destinations,
  real link mappings and ownership metadata as needed. Never invent absent copy/product data.
- Section `assets` entries include `sourceNodeId`, snapshot-relative `path`, and their usage.
  The files must contain the actual source export/image bytes, not placeholders or hand-drawn SVG.

`design-system.json`, `components.json`, content-map, full/section references, asset bytes and
`docs/factory/project/PLAN.md` complete the offline source. `liveFigmaRequired` marks a real
unresolved gap and prevents handoff until the gap has been resolved. No whole-file rediscovery
on build/retry. If the current snapshot belongs to another file, it is archived before discovery.

Original Figma export helper (node ID and path must come from real discovery):

```powershell
node scripts/factory/autopilot/figma-export.js --node <actual-node-id> --output <snapshot-relative-file> --format png
```

The helper stores the exported bytes and a SHA-256/source/time sidecar. MCP exports are equally
valid when saved with their actual provenance. Never set completeness by writing an agent PASS.

## Build and WordPress content

Discovery writes the complete implementation plan, including native backend needs and ACF
field names/types/return formats/group locations. Foundation implements shared pieces, fonts,
ACF Local JSON, actual native content routing and the idempotent importer. Each buildGroup
then gets one independent build session with only its sections and shared design system.

The worker uses `node scripts/factory/autopilot/wp.js <arguments>`: PHP and php.ini are resolved
from this checkout's LocalWP registration. No IDs, database settings or WP roots from old sites.
All content comes from real Figma/approved native sources. Install required plugins when missing.
Never reset the database, overwrite unrelated records, or reimport editor changes on resume.
Before the source is frozen, the host reconciles discovery bookkeeping: stable manifest-array
order becomes the global section sequence; missing section identity comes from its existing
snapshot; absent frame identities come from recorded observations or successful metadata responses.
It does not infer absent node names/types or alter route geometry/content/assets. Identity conflicts
and missing evidence stop the merge. Exact before bytes, hashes and source-log attribution are
preserved in a run-owned `discovery-reconciliation-*` directory. The full validator still decides
whether the source snapshot can be frozen; this merge cannot declare visual completeness.
Use one SCSS file per page, shared component files as needed, and the existing spacing utility
generator/classes. Header is sticky. No typography clamp, fallback copy, fake forms or screenshots.

## Measured visual acceptance

```powershell
npm.cmd run factory:qa:visual -- --route <actual-route-id> --desktop-only
npm.cmd run factory:qa:visual
```

The existing `factory:qa` remains render-health QA; it cannot certify Figma fidelity.
The new capture/comparison command reads only the actual snapshot and current local browser.
It creates fresh full PNGs, section crops, diff PNGs, measured DOM geometry/text styles/images,
and responsive captures. It checks decoded original pixels without resizing the source.
Route preparation, when required, is in project-owned `scripts/factory/project/qa-state.js`.
Before every capture, the host reloads the project preparation module and its project-local dependencies, including edits made by the preceding worker. A long-running host must not reuse an older browser preparation implementation.

Independent audits persist coverage under the run's `audit-progress/` directory. The host splits review into shared components, individual routes and native integrations; the worker commits an atomic checkpoint after each section, responsive check, interaction or native-data check using `audit-progress.js record`. `passed`, `needs_work` and `blocked` all record completed inspection, but unresolved/blocked findings prevent overall PASS. Missing genuine data is recorded and does not force redoing other inspections.

On resume, the host verifies implementation/source/geometry/measurement-policy hashes plus the exact captured evidence. If unchanged, it retains that audit input snapshot and starts a fresh scoped conversation containing only pending items. Completed checkpoints are omitted from source context. Changed evidence invalidates its checkpoint; changed implementation/source/policy requires a new audit binding and capture. This is continuity of an audit of a recorded snapshot, not a claim that external WordPress data can never change; corrections and final acceptance still require fresh runtime measurements. Historical partial reports are available as candidates for targeted verification, never automatically promoted to PASS. Inspect progress with `node scripts/factory/autopilot/audit-progress.js status <ledger-path>`.

Page-only pixel ownership stops at the actual reference image bounds. When a shared header/footer coordinate was inherited from another route, an exact route-local node from a frozen successful Figma observation can establish its ownership band via `source-geometry.js --ownership <route> <observation-relative-to-snapshot> <node-id> <header|footer>`. The registry verifies observation and reference hashes and frame identity. This changes pixel ownership only: structural geometry, the raw full-page diff, and final shared-component checks remain separate. Measurement version 4 prevents mixing older ownership measurements into stagnation decisions.
The host invokes an available hook after navigation for every route, including canonical routes without `state` such as cart and checkout. The hook must select applicable routes and do nothing for others. A route with an explicit `state` still fails if the hook is absent. Never place orders, make payments, or send messages during preparation.
export `async prepare({page,route,baseUrl})`. Drive real UI with actual imported source data;
do not replace DOM with a fixture, send external forms, create real orders, or charge payments.

The user-approved pixel threshold is 8.5%, with 24/255 channel tolerance and 2px geometry tolerance.
Each screenshot has exclusive pixel ownership: header and footer full-width bands, shared component
rectangles, and the remaining page area. Overlaps are counted only once. Original full-frame and
per-section scores remain diagnostics; page readiness does not use a diluted full-frame score.
Header/footer ownership uses semantic landmarks or section identity; repeated section IDs across
build groups and `data-factory-component` mark shared components. Preserve section IDs and source
geometry when extracting a reusable component. Shared components also receive individual scores.

`factory:qa:visual -- --route <id> --page-only` exits successfully when page acceptance passes,
while JSON `passed` remains false if shared acceptance fails. The host independently checks every
route in a completed build group. Header, footer and shared issues can wait for the later shared
correction/final audit; full final acceptance still requires all ownership scores to pass. Section
scores direct correction priorities and do not independently block page readiness.

Workers maintain `docs/factory/project/REUSABLE_COMPONENTS.md` with actual partial/style/ACF/section
mapping. Banner and breadcrumbs should reuse an existing source-compatible component with each
page's own editable title/media/navigation; source differences require explicit variants.
Missing references,
missing states/sections, broken images, console errors and horizontal overflow fail.
No automatic threshold relaxation. Typography rasterization is not called mathematical identity.
Independent fresh-session visual review must also inspect the matching image pairs and derived
responsive captures; a numerical gate by itself cannot detect every meaningful visible issue.

Every correction is followed by a fresh full recapture. Terra fixes deterministic failures first;
Sol starts only after the numeric gates pass, then inspects every source pair and derived viewport.
Its successful audit also writes the final report, avoiding a duplicate full review session.
Sol findings go back to Terra for correction, followed by fresh captures and another independent audit.
Unchanged
implementation after a correction stops a wasteful loop. The final reviewer cannot change the
site or declare readiness over failing deterministic results. Source/build fingerprints bind
captures to the files that were inspected. Every run emits its own truthful report, even on failure.

## Scope of verification

Missing external PDF files, destination URLs and payment credentials are explicit downstream
configuration gaps. They do not block capturing the rest of the available visual source.
Exact draft/Lorem ipsum text present in Figma is preserved and flagged, never invented or replaced.
Unavailable source imagery/geometry still prevents visual acceptance. No fake order/payment
success is used to certify a native confirmation state.

Syntax/contract checks are separate from live execution. No synthetic source/site content is
generated for tests. Only a real completed RudnikAgro run, fresh matching captures, measured
results and independent review can establish end-to-end operation. Until then it is unverified.

## Deferred visual work and image diagnostics

Three captures across distinct implementation hashes, with matching source/reference and thresholds,
all at most 13% page mismatch and less than 3 percentage points best-to-worst improvement, allow
DEFERRED TO FINAL. Geometry/runtime failures still block handoff. buildReady differs from pagePassed
and passed; state.deferredVisual retains exact unresolved comparisons. A resumed build checks this
before spending another worker session. Deferred work triggers Sol final audit before corrections.

Page-only captures skip header/footer assessment and saved crop images. Final capture reviews one
representative per source section set and viewport width; repeated routes reuse that assignment.
Skipped owners are unassessed, never PASS. A correction warrants fresh verification.

pixels.imageDiagnostics separates loaded photo interiors (minimum 80px, 4px inset) from other page
pixels. Raw reference/diff remains intact. Verify source asset, placement, dimensions, crop and border
before accepting raster noise. CSS backgrounds remain in ordinary diff until separately inspected.
No automatic blanket photo exemption or fabricated source identity is allowed.

### Verified coordinate corrections

`source-geometry.js <route> <retained-node-response.json>` can reconcile the narrow
bottom-versus-top error for vector-backed sections. It requires a unique background
with matching dimensions containing the exact source anchor. No coordinates are
inferred from the implementation. Corrections retain before/after records and hashes
of the frozen manifest, original PNG and raw Figma node response. The original
snapshot stays unchanged. Both scoped worker context and visual QA resolve the same
verified route coordinates; modified evidence fails closed. Workers must not edit
this registry. Other source ambiguities still require source verification.

Page-only measurements now cover the band bounded by source page sections. Pixels
outside it remain in the raw full-frame diff but are excluded from page acceptance.
This prevents a shared footer with another route's coordinates from inflating the
page score. Page section geometry must still pass independently. Stagnation history
must match measurement version, scope and effective route geometry.

### Missing real source inputs and scoped retries

After a fresh host check, build retries receive only failing routes in their prompt
and source projection. All sibling routes are still verified after shared changes.
A worker may declare an unavailable genuine business input using a retained
`*.source-dependency.json` artifact, with version 1, kind `missing-source-input`,
routeId, missingInput, reason, sourceEvidence and runtimeEvidence. The source files
must belong to the frozen snapshot; runtime evidence must contain a real read-only
probe. The host hashes the evidence and requires healthy runtime captures before
carrying the route as `requires_source_input`. CSS/geometry problems do not qualify.
These routes retain failed comparisons and block final completion. They are excluded
from cosmetic correction loops; independent pages continue. REPORT.md lists both
source dependencies and deferred visual work. No source data or visual PASS is invented.
Coordinate reconciliation also accepts an optional mapping JSON (section id and source nodeIds). It permits only same-sized translations calculated from the retained route-frame nodes, including a union of section backgrounds. It never resizes a reference to fit the implementation. Pending source dependencies persist across repair sessions and are excluded from the next focused assignment while all routes remain independently checked.

### Source content policy and state families

The current user policy is in factory/autopilot.json contentPolicy. Read
COMMERCE_AND_ICONS.md for native card products, categories, sourced reviews,
proportional variation pricing, editable SVG attachments and required native probes.
Historical no-native-reviews declarations do not block authorized source import.

state-plan.js analyzes existing PNG crops before foundation/build. Same entity/path,
language and width form a state family with an explicit canonical view. Build that
view first; state contexts omit exact repeated source sections. template-evidence.js
retains accepted canonical crop signatures and immutable comparison hashes. Fresh
renders reuse the result only for matching source/render crops and passing geometry.
Reused areas have their own pixel ownership, original comparison link and no duplicate
crop artifacts. Different crops, geometry, thresholds or altered historical evidence
invalidate reuse. Raw full-page diff remains diagnostic. No Figma raster redownload
is performed. Scope changes invalidate stagnation history to avoid mixing scores.
