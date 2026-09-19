const fs = require('fs');
const path = require('path');
const { ROOT, read } = require('./common');

function prompt(stage, task, runDir, feedback = '') {
  const project = read(path.join(ROOT, 'factory/project.json'));
  const visual = read(path.join(ROOT, 'factory/autopilot.json')).visual;
  const common = require('./prompt-topics').common(task.type || require('./model-router').classifyTask(task)) + '\nRead task-capsule.json in this attempt directory. Task: ' + task.id + '\n';
  if (stage === 'foundation' && task.id === 'global-layout') return common + `Prepare only global fonts/weights, existing grid/tokens/utilities and native route skeletons needed to render components. Source values come from scoped design-system records. Do not build page layouts or import product content. Record reusable patterns (including banner/breadcrumb/card grids with per-page source data) in scripts/factory/project/component-registry.json as an array of {id,sections:[exact manifest section IDs],files:[project-relative partial/style files]}. Different titles or media do not require different layout code; genuine layout variants remain explicit. Never guess source IDs. Save evidence of font loading and grid dimensions. Build and lint changed files.`;
  if (stage === 'discovery' && task.sections?.length) return common + `Discover ONLY these source sections: ${task.sections.join(', ')}. Reuse cached full references and successful observations. Read exact targeted Figma nodes only where source facts are missing. Persist compact content/layout/asset records immediately per section. Export exact SVG icons; capture native product/category/tag/option hierarchies where present. Preserve original frame viewport dimensions; active frames are state specifications. Follow existing schemas and source-context paths. Run node scripts/factory/autopilot/gates.js group ${task.buildGroup} ${task.sections.join(' ')}. Do not inspect unrelated sections or implement the site.`;
  if (stage === 'foundation' && task.type === 'native-content') return common + `Import ALL source products and editable global content now, before page components. Use scoped source records programmatically; do not dump the content map. Save a durable native-content checkpoint per product/category/import batch. Preserve editor values on retry. Save a read-only native WordPress probe matching source identity, media, price, categories/tags/options/variations and ACF SVG attachments. Report missing source facts honestly. Prepare skeleton page routes and templates without building page layouts.`;
  if (task.type === 'component-build') return common + `Build ONLY the capsule component/section on its assigned canonical route or active state. Read its source facts/reference and bounded existing snippets. Reuse existing shared partials and native content. If reuseComponent is present, configure that established component with the sourced title/media/variant instead of duplicating its layout. Save the section mapping in REUSABLE_COMPONENTS.md. For interactive source states implement a real scripts/factory/project/qa-state.js prepare({page,route,baseUrl}) hook using the actual controls; never fabricate DOM for captures. Never implement a whole build group in this task. Finish with build/lint and measured local component evidence; the host independently checks the component. Page y-placement and responsive acceptance remain later whole-page gates.`;
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
First understand full-page compositions, continuous backgrounds, grids, exact fonts/weights, assets and native backend needs.
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
Set snapshot complete only once every artifact is present; run npm.cmd run factory:figma:validate and node scripts/factory/autopilot/gates.js snapshot.
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
Run npm.cmd run build and PHP lint, verify runtime.`,
    build: `BUILD ONLY THE ASSIGNED BUILD GROUP and its actual routes/state variants from manifest.
Read global design system + assigned route snapshots and references + relevant current files, not all Figma/history.
Read only assigned-group PLAN.md/STATUS.md excerpts. Implement sections in source order, reusing shared components, native content and importer.
Per section: inspect local reference -> PHP/ACF/SCSS -> import exact content -> build -> capture -> measure -> correct -> recapture.
Use npm.cmd run factory:qa:visual -- --route <route-id> --page-only for fresh separate page/shared comparisons (see AUTOPILOT.md).
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
Visual items: inspect matching reference/render/diff for the assigned section; report issue ID, priority, property, expected/actual and fix.
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
  if (['style-fix','template-fix'].includes(task.type)) return common + stages.correct;
  if (!stages[stage]) throw new Error(`Unknown stage ${stage}`);
  if (stage === 'discovery' && task.scope === 'inventory') return common + `
GLOBAL FIGMA INVENTORY ONLY; detailed section work will run in separate sessions afterwards.
Read AUTOPILOT.md snapshot contract and scoped sourceContext index; inspect specific manifest/observation records only.
Reuse all valid source exports; never repeat a completed read.
Enumerate actual PAGEs and top-level frames, classify EVERY frame and state, save all exact full PNG references with source provenance.
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
