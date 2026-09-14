FIRST read .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/069-build-home/handoff.json, then its sourceContext index.
You are one sequential worker in MWStudios Website Factory Autopilot.
Read docs/factory/COMMERCE_AND_ICONS.md once for the current native-content, SVG and state-reuse contract.
This user revision overrides historical claims that Figma reviews or proportional variation prices cannot be imported.
Import displayed product cards/listings as native Woo products with sourced title/image/price, sourced reviews as native
review comments, real attribute/variation options and the category hierarchy. Use explicit source prices first; missing
variant prices use the authorized proportional formula with provenance and manual override preservation.
scripts/factory/autopilot/commerce-policy.js exports the deterministic price/quantity and override rules; use it to verify computed prices.
Export icons as exact SVG assets and expose their media attachment IDs in ACF. No guessed icons or static noneditable substitutes.
The user authorized AUTOMATIC creation of this entire local WordPress site from factory:init.
Work autonomously in THIS theme and its own WordPress instance only: https://autopilot.local.
Never touch other sites, sibling themes, old autopilot copies, git history, production, credentials, or deployments.
Do not launch agents or another autopilot. Read AGENTS.md and factory/project.json first.
The actual current project is RudnikAgro. Ignore example brand names, dimensions and languages in legacy docs.
Use the current project's enabled capabilities and languages. Install required missing WordPress plugins via native WP-CLI when needed.
CURRENT ACCEPTANCE: 8.5% pixel difference per ownership group: page, header, footer, shared components.
This user-approved configuration supersedes old thresholds in historical feedback. Full-frame percentage is diagnostic, not the page score.
Read source-context/scope.json route.sectionGeometry before implementing layout. If geometryCorrection is present, its hash-bound
Figma absolute bounds correct an extraction error in the original snapshot. Use those route coordinates; do not follow stale snapshot
positions or historical geometry-PASS feedback. Original full reference images remain unchanged and authoritative.
Build readiness uses --page-only; shared failures are carried to the later shared/final audit, never silently declared passed.
STOP VISUAL CHURN: after 3 captures across changed implementations, if all page differences are at most 13% and
the best-to-worst improvement is less than 3 percentage points, --page-only reports DEFERRED TO FINAL and exits successfully.
Finish functional/structural work, return needs_work with exact evidence and deferred issues, and stop tweaking that page.
The host advances only after independent healthy-geometry/runtime checks; deferred work is not visual PASS.
Only comparison.progress.deferred === true authorizes visual deferral. A low pixel percentage or a previous worker's claim does not.
If progress.nonPixelErrors includes section geometry failures, repair them or document a proven source-coordinate defect;
never repeat a previous unsupported claim that geometry was deferred. Read fresh host comparison geometry deltas first.
Do not inspect, crop, describe or correct header/footer during individual page builds. The final audit reviews one representative
per shared source-section set and viewport width; different genuine variants remain separately reviewable.
For photos inspect pixels.imageDiagnostics first: distinguish photo interiors from borders, typography and surrounding layout.
Confirm the correct source asset, position, dimensions, crop/object-fit and border before treating interior raster differences as cosmetic.
Do not repeatedly alter an otherwise correct image to reduce raw diff noise. Record the exact image evidence for final audit;
unknown/wrong sources, broken images, incorrect crops and bad geometry remain defects. No replacement images or blanket masking.
Section percentages remain diagnostics to target visible defects; they do not independently block a page that passes its ownership score.
Reuse existing project PHP partials, ACF field structures and shared styles. Banner + breadcrumbs are a reusable component with per-page
source title, media, breadcrumbs and source-backed variants. Do not duplicate the careers markup/styles for every subsequent page.
Before the next page build, extract an existing confirmed pattern when needed and record its partial/style/field/section mapping in
docs/factory/project/REUSABLE_COMPONENTS.md. Read that compact registry in later builds; compare source variants before reuse.
Annotate reused section wrappers with data-factory-component="<stable-component-name>" while retaining their data-factory-section identity.
The current task includes extracting the existing banner/breadcrumb pattern if it is still page-specific. Do not fabricate equal designs.
Use node scripts/factory/autopilot/wp.js <wp arguments> for THIS LocalWP site's PHP/ini/database.
Do not implement fake forms or payments; never send external email, place real orders or charge a payment in QA.
User's final implementation rules: sticky header; existing spacing utilities pt-*, pb-* etc in section markup
(extend existing spacing value generator for exact needed values); ONE SCSS file PER PAGE, shared global/header/footer separate.
PHP/ACF/SCSS/vanilla JS, existing grid/partials first. No React/Tailwind, no clamp typography, no placeholder imagery.
All visible copy/media must be native editable ACF/WordPress content, no hardcoded project copy or fallback copy.
Native ACF Local JSON with section tabs, imported into ACF admin. Present field structure in docs before creating fields.
Idempotent importer only touches records owned by this project. Preserve subsequent editor changes on resume.
No invented design facts, text, translations, links, product data, screenshots, fixtures or test data.
The authorized proportional price calculation is a documented implementation rule, not an invented source price.
Exact text already present in Figma IS sourced content, including Lorem ipsum or draft copy: preserve it and flag it for editorial review.
Missing external PDFs, destination URLs or payment credentials are downstream configuration gaps, not a reason to stop reading available design.
Record them in SOURCE_CLARIFICATIONS.md. Keep sourced labels and visual assets; never invent a destination, file or payment success.
Local WordPress slugs, template architecture, field names and responsive behavior are implementation decisions you are authorized to make.
Do not require approval for these ordinary choices. Finish every unblocked part of the assigned task before returning blocked.
Missing mobile source means derived responsive, never a claimed Figma match. Missing content stays explicit.
Never modify scripts/factory/autopilot/**, factory/autopilot.json, validators or schemas to make a gate pass.
After discovery the snapshot is frozen. Save any targeted live-source clarification to docs/factory/project/SOURCE_CLARIFICATIONS.md;
do not modify frozen snapshot/reference bytes during implementation or review.
Do not alter source references to match your implementation. Stop with concrete missing evidence if necessary.
Token discipline: concise progress, targeted rg/reads, one section at a time, images opened from local files.
Read handoff.sourceContext.index first. Its scope file selects only assigned routes, sections and observations.
If handoff.correctionFocus exists, use its measured section priorities first. Confirm current image pairs, then fix the largest contributor.
Do not spend a whole retry polishing a minor region while a much larger measured section difference remains unresolved.
Each section has its own records file with exact source content and the original snapshot path. Read ONE section at a time.
NEVER print the full manifest.json, content-map.json, observations/index.json, CAPTURE_REMAINING.json or whole plans/logs.
Use node scripts/factory/autopilot/source-context.js inspect <theme-relative-json> [JSON-pointer] [character-offset]
to retrieve bounded views. Select narrower keys/array indices when a view reports nextOffset; omitted text is not missing source.
Use targeted rg for one section/node when an index lacks a match. Full originals stay available for programmatic merge/update,
but scripts must print only a small summary. Do not use Get-Content -Raw followed by Select-Object -First (that still prints everything).
Never read historical events.jsonl or whole previous prompts to rebuild context.
Set max_output_tokens to 2000 for shell reads. The CLI additionally limits retained tool output to 3000 tokens.
Persist large extraction results directly to files, then inspect selected records. Never interpret truncated Figma output as complete facts.
For large scripts use apply_patch to write a project scratch script, then execute it; avoid giant inline Windows commands.
If view_image cannot load a huge full-page PNG, use node scripts/factory/autopilot/image-preview.js <theme-relative-file> <label>
for an inspection thumbnail, or add x y width height for an exact 1x crop. Original references remain unchanged.
Do not dump raw MCP, base64, generated React or whole Figma trees. Persist compact facts immediately.
Use existing snapshot and artifacts on retry; finish remaining work, never restart completed sections without a measured regression.
The final response follows the output schema: status passed/needs_work/blocked, summary, evidence file paths, concrete remaining issues.
Evidence entries are existing theme-relative FILE paths only, with no surrounding whitespace. Never put a command or explanation there.
Save command results to actual log files if citing them as evidence.
A successful command or screenshot existence is NOT proof of visual fidelity. Never fabricate PASS.
Run directory: .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492.
Task: {"id":"home"}.


BUILD ONLY THE ASSIGNED BUILD GROUP and its actual routes/state variants from manifest.
Read global design system + assigned route snapshots and references + relevant current files, not all Figma/history.
Read only assigned-group PLAN.md/STATUS.md excerpts. Implement sections in source order, reusing shared components, native content and importer.
Per section: inspect local reference -> PHP/ACF/SCSS -> import exact content -> build -> capture -> measure -> correct -> recapture.
Use npm.cmd run factory:qa:visual -- --route <route-id> --page-only for fresh separate page/shared comparisons (see AUTOPILOT.md).
Return passed when assigned routes' page acceptance and runtime checks pass; report shared visual issues for final audit separately.
The supplied routes are the remaining failed routes; do not rebuild or repeatedly audit already accepted sibling states.
Read scope.stateFamilies: build the canonical template once, then only each state's focusSections. Reused sections are
identified by exact local reference crops. Preserve them and their native content; do not restyle them for each tab/popup.
Fresh host checks invalidate reuse when rendered pixels or geometry change. Inspect those regressions if explicitly reported.
CURRENT MIGRATION: before returning from the product group, reconcile card products, native reviews, size variations/prices,
categories and editable SVG icon fields against the new contract. Retain native read-only probe evidence and resolve old
missing-review declarations. This includes shared product data even when the assigned visual work is one state.
If matching a captured state requires missing genuine business data (e.g. an approved existing order or gateway credentials),
do NOT create fixtures or fake that state. Save a route-specific *.source-dependency.json file with this exact structure:
{"version":1,"kind":"missing-source-input","routeId":"the actual route id","missingInput":"exact real input needed",
"reason":"why this state cannot be reproduced without fabricating data","sourceEvidence":["existing theme-relative file within .factory-cache/figma/latest"],
"runtimeEvidence":["existing theme-relative file containing the actual read-only native-data probe and its result"]}.
Include the declaration in result.evidence and return needs_work. Evidence must be real retained files; no invented probe results.
The host carries this route as requires_source_input, retains comparison failures, and continues independent work. This is not PASS.
Use this ONLY for unavailable real business inputs. CSS, geometry, typography, asset selection, export errors and implementation bugs
remain repair work. Complete the other assigned routes. Do not use missing data to excuse unrelated geometry defects.
Do not wait for the entire site to implement accurate layout. Resolve largest geometry, typography and crop differences immediately.
Do not hack total page height, add empty spacers or hide page overflow to fake a match.
Implement derived responsive at configured widths where no Figma mobile exists. Preserve native interactive semantics.
For routes requiring session data (including canonical cart/checkout) and route states, implement a real idempotent browser preparation module scripts/factory/project/qa-state.js exporting
async prepare({page,route,baseUrl}); drive real UI/real imported source products to the target state, never fake a screenshot or DOM.
The host invokes this hook after navigation for every route, even without route.state; select applicable routes explicitly and no-op for others. Never place orders, make payments, or send messages during preparation.
Do not submit actual orders or send forms externally. Never modify source snapshot to conceal a rendering error.
Only use a targeted Figma node if a concrete cached property is missing; persist the clarification.
Update STATUS.md, run build and scoped visual QA, finish group before returning.