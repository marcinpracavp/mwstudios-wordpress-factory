const fs = require('fs');
const path = require('path');
const { ROOT, read } = require('./common');

function prompt(stage, task, runDir, feedback = '') {
  const project = read(path.join(ROOT, 'factory/project.json'));
  const visual = read(path.join(ROOT, 'factory/autopilot.json')).visual;
  const discoverySourceRule = stage === 'discovery' ? 'SOURCE AUTHORITY: Use the Figma URL from factory/project.json. Existing PHP/ACF, project reports and previous-run records are reuse candidates, not evidence of current Figma node IDs, content, assets or states. Reuse cached source facts only when their provenance matches the current file and section. If a cached node is not found, inspect the current section subtree and reconcile stale records against observed nodes; do not keep previous-project assets or states as current requirements. Preserve an explicit gap when current source evidence is insufficient. Write source facts to the authoritative snapshot/content-map, not only generated attempt source-context projections.\n' : '';
  const common = require('./prompt-topics').common(task.type || require('./model-router').classifyTask(task)) + '\nRead task-capsule.json in this attempt directory. Task: ' + task.id + '\n' + discoverySourceRule;
  if(task.type==='final-audit')return common+`FINAL SOL HIGH AUDIT, once for this run. Mode: ${task.mode}. Read the compact final-review packet in capsule feedback; follow one route/section evidence pointer at a time. Inspect source/reference/render/diff, image diagnostics and only applicable checks linked in the capsule. Use retained host interaction/native evidence when present; do not rebuild the test harness or launch an unrelated browser/profile. Missing required evidence stays an explicit finding. Do not modify implementation. In pixel-perfect mode target <=2.5% effective layout difference. Report concrete route, section, property, expected/actual and evidence for every issue. Minor margin/padding/overflow corrections will be assigned to Luna after your review. Never pass inaccessible states, missing proof or unverified raster exclusions. Save a final report file and return its path. Do not repeat already proved identical shared/state sections.`;
  if(task.type==='final-polish')return common+`ONE ROUTE-LEVEL SOL POLISH. Earlier bounded Luna/Terra/source attempts made no further measurable implementation progress. Inspect capsule.fullPageEvidence (reference, render and diff) and the complete capsule.routeBlueprints entry before any section crop. Work only on this one route and prioritize semantic completeness, section composition/order, typography and large pixel contributors before sub-pixel offsets. The focused sections are hints, not permission to ignore missing route content. Make one coherent measured implementation pass, build, and save full-page/section evidence. Do not alter source snapshots, thresholds or Factory infrastructure. Remaining honest differences go to human review; do not start another strategy loop.`;
  if(task.type==='state-preparation')return common+`PREPARE ONLY the unavailable route/state from the capsule. Determine whether missing session data, an absent section, a redirect, or missing genuine business input caused the empty render. Implement a real idempotent qa-state.prepare hook only when the required real data exists. Never create an order/payment or synthetic business history. Save source-dependency evidence and return blocked when genuine input is unavailable. Do not attempt CSS/height fixes on an unprepared state. Save a preparation/probe record before returning.`;
  if(task.type==='source-extraction')return common+`TARGETED SOURCE RECOVERY, not another blind visual retry. The assigned component exhausted its normal repair budget and the capsule contains a fresh full-page comparison plus failed component captures. Read ONLY the assigned recovery diagnosis, task capsule and exact assigned section snapshot; never search or read other .factory-cache/autopilot runs, events.jsonl files, historical prompts or logs. First inspect those reference/render/diff artifacts and the exact assigned Figma section subtree using the Figma MCP. If MCP reports AuthRequired but FIGMA_TOKEN is available, do NOT stop: retrieve only the exact missing node subtrees through the safe REST fallback: node scripts/factory/autopilot/figma-node.js --nodes <node-id,node-id> --output .factory-cache/figma/latest/observations/recovery-<section>.json. Persist provenance in that same frozen snapshot observations directory and cite its exact project-relative path in evidence. Reconcile every visible, missing source node (text, CTA/link, image/export, crop and geometry) into the existing frozen snapshot/content map and its native import mapping. Then make only the scoped, editor-owned implementation/import correction needed to render those source facts. Do not invent content, substitute similar media, alter thresholds, or mark the component accepted. Save a compact recovery record with the exact Figma node IDs and the full-page/component evidence used; build and let the host recapture it.`;
  if(task.contentKeys?.length)return common+`BOUNDED NATIVE BATCH. Follow capsule.batchInstructions. Import/verify only capsule.contentRecords; do not process the entire content-map or rerun an unscoped importer. Start with scripts/factory/project/import-content.php and commerce-probe.php: inspect function names first, then at most 60 lines around the relevant product mapping. WP resolver is scripts/factory/autopilot/wp.js (small read-only engine helper; use its wp(args) export). Do not recursively search scripts/factory, .factory-cache or the repository for generic words such as product/sourceNode. Limit every search output (rg -m 12 against ONE named file; show at most 30 matching lines using the current shell). If relevant code is absent, create the scoped adapter directly. Extend a reusable scoped importer accepting explicit source keys, with no automatic full-import fallback. For listing-bind update only these product relations, not the page template. Preserve existing batch records and editor overrides. Provide project-owned scripts/factory/project/native-batch.js exporting async verifyBatch({kind,records,keys,readOnly}). It must query current WordPress data without mutation and return {readOnly:true,records:[{key,passed,observed:{actual native identity and relevant media/price/taxonomy/option/ACF values}}]}. Compare observed values against each source record; passed cannot be a constant. Exactly the assigned keys, no missing/extra records. The host runs this probe before and after work, so completed imports survive code changes and session interruptions. Persist the native probe evidence. One batch per fresh session; next batch belongs to the host.`;
  if (stage === 'foundation' && task.id === 'global-layout') return common + `Prepare only global fonts/weights, existing grid/tokens/utilities and native route skeletons needed to render components. Source values come from scoped design-system records. Do not build page layouts or import product content. Record reusable patterns (including banner/breadcrumb/card grids with per-page source data) in scripts/factory/project/component-registry.json as an array of {id,sections:[exact manifest section IDs],files:[project-relative partial/style files]}. Different titles or media do not require different layout code; genuine layout variants remain explicit. Never guess source IDs. Replace stale component mappings from earlier projects. Inspect scripts/factory/project/qa-state.js and native-batch.js for previous-project assumptions; adapt project hooks to the current frozen source before they are used, without importing old project content. Save evidence of font loading and grid dimensions. Build and lint changed files. This task has no assigned visual sections or measurements; when the foundation implementation and validation pass, return status passed and record visual QA as a later-stage dependency rather than returning needs_work.`;
  if (stage === 'discovery' && task.scope === 'canvas-backfill') return common + `CANVAS BACKFILL AND SOURCE-FACT RECONCILIATION ONLY. Do not implement or edit WordPress/PHP/SCSS/JS.
Inspect immediate children of EVERY production/state frame and persist manifest.canvasAudit from frame-local bounds and visibility, never layer-panel order. Read source-context/scope.json /canvasContradictions and /topologyContradictions first. A topology contradiction means a visible node assigned to a section falls outside that section's recorded semantic bounds: re-read the complete route composition, then either expand the real semantic section and its reference or split the distinct visual cluster into its own ordered route section. Do not mechanically widen a crop across unrelated content, reassign nodes merely to silence the gate, add a spacer, or preserve an image-only section when its source-backed copy/CTA belongs to the same composition.
Every visible child must be assigned to a route section, decoration or duplicate. When a visible cluster within the page is omitted from route.sections (including cards, labels and thumbnails listed below Footer), create a semantic section ID, insert it in canvas order, and fully discover it now: exact section JSON, reference crop, sourced assets, content-map records and geometry. Do not add a spacer or modify existing section geometry to conceal it.
Promote manifest.snapshotVersion to at least 1.1. Run node scripts/factory/autopilot/gates.js snapshot and return passed only with its real evidence.`;
  if (stage === 'discovery' && task.sections?.length) return common + `Discover ONLY these source sections: ${task.sections.join(', ')}. Reuse cached full references and successful observations. Read exact targeted Figma nodes only where source facts are missing. Persist compact content/layout/asset records immediately per section. Export exact SVG icons; capture native product/category/tag/option hierarchies where present. Preserve original frame viewport dimensions; active frames are state specifications. Follow existing schemas and source-context paths. Run node scripts/factory/autopilot/gates.js group ${task.buildGroup} ${task.sections.join(' ')}. Do not inspect unrelated sections or implement the site.`;
  if (stage === 'foundation' && task.type === 'native-content') return common + `Import ALL source products and editable global content now, before page components. Use scoped source records programmatically; do not dump the content map. Save a durable native-content checkpoint per product/category/import batch. Preserve editor values on retry. Save a read-only native WordPress probe matching source identity, media, price, categories/tags/options/variations and ACF SVG attachments. Report missing source facts honestly. Prepare skeleton page routes and templates without building page layouts.`;
  if (task.type === 'component-build' && task.mode === 'route-build') return common + `ROUTE-FIRST BUILD. Implement the complete single route described by capsule.routeBlueprints, in source sectionOrder, using its exact editable content/assets and full-page reference. The focus is this route only; do not inspect or implement unrelated routes. Start by inspecting capsule.fullPageEvidence when present and the complete route reference, then implement all assigned page-owned sections as coherent semantic wrappers. Each data-factory-section must own its visible source-backed media, headings, body copy and controls; child fragments may have data-factory-component but must not escape into unregistered sibling sections. Reuse existing partials/utilities and capsule.reusableRoutePatterns. Prefer a stable page template plus ACF groups, image/link/WYSIWYG fields and repeaters for genuinely repeated items; do not build a generic page builder or hardcode editable content. Build and capture the whole route. Return remaining pixel polish as measured findings; the host will replan section repairs from a fresh full-page capture.`;
  if (task.type === 'component-build') return common + `Build ONLY the capsule component/section on its assigned canonical route or active state. Read its source facts/reference and bounded existing snippets. Reuse existing shared partials and native content. reuseComponent/reuseComponents are implementation fragments and file-scope hints, not proof that the first listed fragment equals the whole source section: render and source-tag the complete assigned section, including its route shell/listing where provided. Save the section mapping in REUSABLE_COMPONENTS.md. For interactive source states implement a real scripts/factory/project/qa-state.js prepare({page,route,baseUrl}) hook using the actual controls; never fabricate DOM for captures. Never implement a whole build group in this task. Finish with build/lint and measured local component evidence; the host independently checks the component. Page y-placement and responsive acceptance remain later whole-page gates.`;
  const stages = {
    discovery: `DISCOVERY + COMPLETE LOCAL SNAPSHOT. Do not implement PHP, SCSS, ACF or change WordPress.
Read docs/factory/FIGMA_SNAPSHOT.md, factory/schemas/figma-* and docs/factory/AUTOPILOT.md (snapshot contract).
ON CONTINUATION: first use the scoped sourceContext index. The host persisted successful structured Figma reads in observations.
Read only relevant observation files and compile their real facts into the snapshot. Do not re-read nodes whose observations are sufficient.
Existing valid reference PNGs and source sidecars MUST be reused; do not export the same frame again.
After EACH section read, write its compact snapshot/content records immediately before moving on; do not accumulate dozens of reads in memory.
Source URL comes ONLY from factory/project.json. Enumerate all PAGE nodes once (use figma-use skill before use_figma,
or direct MCP get_metadata without nodeId if that server explicitly returns the page list).
Inventory every top-level frame, classify production pages vs state variants vs research/archive; never silently omit frames.
First understand full-page compositions, continuous backgrounds, grids, exact fonts/weights, assets and native backend needs. Before section extraction, write the semantic route outline in canvas order (for example media-copy, repeated stats, copy-media, centered WYSIWYG), identify repeated layout patterns across routes, and map each cluster to an editor-owned ACF/native field structure. Section snapshots are implementations of that route outline, never arbitrary Figma frame crops.
Capture full production references at exact 1x Figma dimensions immediately, then section references. Save actual PNG/SVG/image bytes.
Use Figma design-to-code skill and get_design_context PER LOGICAL SECTION; not a huge whole-page generated-code call.
Download exact source assets while URLs work. No similar icons. Raw original image fills when a photo must be editable.
Map ALL production frames and states to manifest.routes entries; productionFrames inventory must classify every discovered frame.
Shared header/footer/components are read once then reused with per-route placement records. Sections have globally unique stable IDs.
Snapshot files: pages.json, manifest.json, design-system.json, components.json, content-map.json, sections/*.json,
assets/references/*, references/full/*.png, references/sections/*.png; implementation plan docs/factory/project/PLAN.md.
Use schemas, don't invent another format. manifest.routes contract in AUTOPILOT.md is the execution and comparison plan.
Content map retains exact original text, node IDs, intended ACF/native destination, source language, actual target link evidence.
Write section geometry x/y relative to full production frame (not global Figma canvas). Exact text styles, crop, effects and subnode geometry.
No mobile node/reference when absent; record responsiveSource=derived. Never duplicate desktop PNG as mobile.
Keep explicit gaps with liveFigmaRequired true; complete means offline build can proceed, with actual assets and references present.
Match QA routes/languages/source viewport widths to discovery. Keep browser viewport height around 900, source full-page height separate.
Create PLAN.md covering buildGroups in dependency order, ACF field structures, import ownership, native Woo/CF7/blog behavior, and states.
Set snapshot complete only once every artifact is present; run npm run factory:figma:validate and node scripts/factory/autopilot/gates.js snapshot.
Manually verify three separated sections against their real source facts/references. Finish whole discovery, not just home.
If remote exports are needed use scripts/factory/autopilot/figma-export.js (FIGMA_TOKEN from environment); never log tokens.
Do not access other themes or import their snapshot/implementation.`,
    foundation: `BUILD FOUNDATION. Read the scoped index, global design-system/components, and targeted foundation/shared PLAN.md excerpts.
Read exact content from one section records file at a time. Parse the original manifest/content-map programmatically for imports, without dumping them.
Read actual boilerplate utilities, partials, Webpack inputs, native ACF and registered menus.
Implement exact global fonts/weights/tokens/grid/buttons/backgrounds, shared header/footer, required plugins and native template routing.
Create project ACF Local JSON tabs and idempotent importer at scripts/factory/project/import-content.php, backed ONLY by snapshot content.
Create actual native pages/posts/products with source provenance and route ownership; derive no made-up commerce data.
Include source card/listing products, native variations and sourced reviews according to COMMERCE_AND_ICONS.md.
Use native WooCommerce identity/cart/checkout/account if requested, native posts for blog, CF7 backend for forms.
Prepare all shared reusable structures and import actual global content. Activate this theme on the current local site.
Use actual menu items and URLs; all content/media editable. Do not implement all page layouts in this phase.
Write/update docs/factory/project/STATUS.md and CONTENT_IMPORT_PLAN.md with actual completed work and gaps.
Run npm run build and PHP lint, verify runtime.`,
    build: `BUILD ONLY THE ASSIGNED BUILD GROUP and its actual routes/state variants from manifest.
Read global design system + assigned route snapshots and references + relevant current files, not all Figma/history.
Read only assigned-group PLAN.md/STATUS.md excerpts. Implement sections in source order, reusing shared components, native content and importer.
Per section: inspect local reference -> PHP/ACF/SCSS -> import exact content -> build -> capture -> measure -> correct -> recapture.
Use npm run factory:qa:visual -- --route <route-id> --page-only for fresh separate page/shared comparisons (see AUTOPILOT.md).
Return passed when assigned routes' page acceptance and runtime checks pass; report shared visual issues for final audit separately.
The supplied routes are the remaining failed routes; do not rebuild or repeatedly audit already accepted sibling states.
Read scope.stateFamilies: build the canonical template once, then only each state's focusSections. Reused sections are
identified by exact local reference crops. Preserve them and their native content; do not restyle them for each tab/popup.
An "active elements" frame is an interaction specification for the same page, not a second page/template. The base frame
defines the normal layout. Implement the active frame through real UI states on those same components. If an overlay
changes a reference crop (for example a menu above the hero), inspect the overlay and its measured affected region;
do not redesign the underlying accepted section to reproduce the composite image. Apply this rule to every state family.
Fresh host checks invalidate reuse when rendered pixels or geometry change. Inspect those regressions if explicitly reported.
Native product content was imported in foundation; do not repeat that work unless this capsule assigns a content defect.
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
Update STATUS.md, run build and scoped visual QA, finish group before returning.`,
    audit: task.auditCheckpoint ? `INDEPENDENT CHECKPOINTED AUDIT. Do not change implementation, source, thresholds or acceptance checks.
FIRST read ${task.auditCheckpoint}. It is the complete assignment for this session: inspect ONLY its pending items, not the whole site.
The packet includes atomic checkpoint commands and the input JSON schema. After EACH section, responsive check, interaction or native-data item,
write its concrete observations to a dedicated JSON file and run the record command immediately, before starting another item.
Do not postpone checkpoints until the end of the route or session. Each item can be passed, needs_work, or blocked; all are durable coverage,
but only passed means acceptance. If a real order/payment credential or other genuine input is missing, record blocked with evidence and
continue the remaining independent items. Never fabricate source data or submit orders, payments, emails, or registration forms.
Already completed items are immutable evidence: do not repeat their images/tools/reads. Earlier legacy reports are candidate evidence,
not automatic PASS: read only relevant records, validate against this input snapshot, and checkpoint supported conclusions.
Full-page items: inspect the complete matching reference/render/diff at the source frame width first. Do not inspect individual sections unless the packet adds an escalated section item after a failed full-page checkpoint.
Visual section items: inspect only the matching reference/render/diff for that escalated section; report issue ID, priority, property, expected/actual and fix.
Responsive items: inspect the retained widths and actual overflow/controls. Interaction items: real isolated browser session without business side effects.
Native items: verify relevant COMMERCE_AND_ICONS.md contracts using retained exact probes or new read-only checks where needed.
Shared components are assigned separately and must not be re-audited in route units. Scope state families to the real changed states.
Use dedicated evidence files per item so later work does not invalidate previously checkpointed evidence. Do not edit the ledger or checkpoint
files directly; use audit-progress.js record. Do not write whole-site FINAL_REPORT or FINAL_VISUAL_AUDIT: the host aggregates every checkpoint.
Return passed/needs_work only AFTER every pending item was saved. Include checkpoint paths in evidence and concrete unresolved issues.
A usage-limit interruption must leave every earlier item saved; a fresh session will receive only the missing items.
` : `INDEPENDENT VISUAL AUDIT. Do not change implementation, source, thresholds or acceptance checks.
Read latest deterministic visual comparison evidence and actual matching reference/browser/diff PNGs, not previous claimed PASS.
Review ALL routes and states: full composition first, then EVERY section; inspect exact typography, wraps, spacing, geometry, images/icons,
continuous effects, native controls. Check responsive screenshots at each configured width and actual navigation/menu/cart/accordion behavior.
Use browser measurements and native WP queries when needed; no fabricated precision. Do not send emails or create fake content.
Write docs/factory/project/FINAL_VISUAL_AUDIT.md: issue ID, route, section, P0/P1/P2/P3, property, expected, actual, measured delta, fix.
Verify real editable content and required native plugin integrations alongside visual and responsive coverage.
Write docs/factory/project/FINAL_REPORT.md with exact current evidence paths, measured results and known limitations.
This audit is the final independent review; do not defer its coverage to another identical session.
Review COMMERCE_AND_ICONS.md evidence: real native card/listing products, variation attributes/prices, parent-child categories,
source review comments and SVG media/ACF field mappings. Inspect each unique template/state; verified reused crops link to their
original comparison and do not require another identical visual inspection. A changed crop remains a regression to review.
Return passed only when every source route/state and derived viewport was inspected and no unresolved visible mismatch remains.
Return needs_work with concrete issues for corrector otherwise. A numerical pixel gate alone is not visual review.
Missing screenshots or untestable states mean blocked, not passed.`,
    correct: `CORRECT CONFIRMED DIFFERENCES. Read the assigned measured comparison JSON and relevant local references.
Read the independent audit only if the assigned issues refer to it; machine-detected failures are corrected before the first independent audit.
Work ONLY on listed failing routes/sections/properties. Read only current section + global design system.
Fix all P0/P1/P2 and safe P3 issues, in order of greatest geometry/typography/image delta.
Before -> edit source -> build -> import only needed owned data -> fresh scoped QA -> after -> measured comparison.
No full rediscovery, no rebuild from scratch, no reference/threshold edits, no artificial page-height matching.
Check regressions in shared header/footer and affected routes. Update audit issue status only with fresh AFTER evidence.
Finish corrections and update STATUS.md. The runner independently recaptures everything afterwards.`,
    final: `FINAL INDEPENDENT REVIEW. Read the fresh current comparison summary, audit and STATUS.md.
Verify all production frames/state variants, real editable content, required plugin integration, responsive views and source assets are covered.
Inspect actual current reference/browser screenshots, all remaining issues, final build output and runtime errors.
Do not implement or alter source. Write docs/factory/project/FINAL_REPORT.md with exact evidence paths and known limitations.
Only return passed if all deterministic comparisons pass AND your fresh visual review finds no remaining mismatch.
Never claim mathematical pixel identity where font rasterization differs; quantify the actual measured result.
Human review readiness is a conclusion supported by artifacts, not a token-saving shortcut.`
  };
  if (task.type === 'final-polish') return common + 'FINAL VISUAL REVIEW AND POLISH. Inspect only assigned remaining items/reference pairs. Apply safe visual fixes yourself, build and recapture. Do not hand polish back to another model. Return passed only with fresh matching evidence. Preserve checkpoint commands for audit tasks.\n';
  if (task.type==='style-fix') return common + 'CSS CORRECTION ONLY. Use the capsule measurements and scoped reference/render. Read bounded excerpts around the assigned selector. Reuse existing utilities. Change only the measured properties, build, capture the affected section and record before/after geometry and effective pixel ratio. Preserve healthy shared components. Do not import content, inspect unrelated pages or expand the assignment. If no measured progress is possible, report the concrete blocker.';
  if (task.type==='template-fix') return common + 'PHP/TEMPLATE CORRECTION ONLY. Inspect the assigned native field or template and its source-backed contract. Reuse existing ACF groups and WordPress helpers, preserve editor values and escaping. Import only explicitly assigned records. Lint/build and retain a runtime probe for the affected output. Do not redesign unrelated layouts.';
  if (!stages[stage]) throw new Error(`Unknown stage ${stage}`);
  if (stage === 'discovery' && task.scope === 'inventory') return common + `
GLOBAL FIGMA INVENTORY ONLY; detailed section work will run in separate sessions afterwards.
Read AUTOPILOT.md snapshot contract and scoped sourceContext index; inspect specific manifest/observation records only.
Reuse all valid source exports; never repeat a completed read.
Enumerate actual PAGEs and top-level frames, classify EVERY frame and state, save all exact full PNG references with source provenance.
For EVERY production/state frame, inspect its immediate children and write manifest.canvasAudit using canvas coordinates (nodeId, name, type, x/y/width/height, visibility and role). Do not trust layer order: a child listed after Footer may still be visible earlier on the canvas. Every visible child must be assigned to a route section, declared decoration/duplicate, or explicitly unassigned for later source work. A visible child cluster with cards, labels or image thumbnails is a candidate section and must be added to the route by canvas position, not omitted because it is lower in the layers panel.
Write manifest routes with actual frame identity, language, width/height, source reference, buildGroup, ordered proposed section IDs.
Shared components may have shared IDs with per-route geometry. Proposed local paths are allowed implementation decisions, not source hyperlinks.
Understand global typography/assets/layout and write compact design-system.json, components.json and docs/factory/project/PLAN.md.
Keep snapshot partial. Do not try to fully detail all sections in this session. Do not implement WordPress.
Run node scripts/factory/autopilot/gates.js inventory. Passed here means global inventory ready for section extraction, NOT complete snapshot.
`;
  if (stage === 'discovery' && task.scope === 'group') return common + `
DETAILED SNAPSHOT FOR ASSIGNED BUILD GROUP ONLY: ${task.buildGroup}.
Global inventory/full references already exist. Do not enumerate pages/frames again or reread unrelated routes.
Read AUTOPILOT.md snapshot contract, scoped sourceContext index, design-system, and only the assigned section files/observation records.
The handoff gate and scoped section list identify remaining work. Do not load global CAPTURE_REMAINING or the entire observation index.
Use existing successful observations and exact full reference crops before targeted new source calls.
For EACH missing section in assigned routes: inspect real source node using figma-design-to-code/get_design_context,
extract exact geometry, text/styles/crop/effects/assets, immediately write compact section JSON and exact content-map records.
Do not accumulate dozens of source reads before persisting. Reuse all valid existing section snapshots, fonts/assets and references.
Get design context per logical section, not an entire huge production frame. Load figma-use guidance before use_figma.
Save exact exported assets and PNG section references (or unscaled crops from original 1x full-frame PNGs with crop provenance).
Keep original full references intact. Record section desktop x/y in production-frame coordinates and shared per-route geometry in sectionGeometry.
Register actual referenced nodes in manifest.frames, append actual sections with globally continuous order.
Use granular real content values; map them to semantic editable ACF/native field structures in the plan.
Finish every section/state belonging to this group. Missing external destinations/files do not prevent capturing their visible source labels/icons.
Preserve source Lorem ipsum verbatim with editorial warning; never invent replacement copy or URLs.
Save external/configuration gaps separately; liveFigmaRequired means missing visual source facts, not business configuration.
Keep manifest status partial; the host certifies completeness once ALL groups pass. Do not implement WordPress.
Run node scripts/factory/autopilot/gates.js group ${task.buildGroup}; fix all group-specific failures before returning.
Passed means this group's source discovery is complete. Future implementation/runtime/visual QA is a later stage and must not cause needs_work here.
The host merges global inventory bookkeeping after all groups; preserve unrelated sections. Report concrete source gaps in this group only.
Only stop blocked for an actual unavailable visual source after finishing all accessible parts; ordinary incomplete work is needs_work.
`;
  return common + '\n' + stages[stage];
}
module.exports = { prompt };
