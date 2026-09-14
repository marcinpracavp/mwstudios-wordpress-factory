FIRST read .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/018-discovery-detail-checkout/handoff.json, then its sourceContext index.
You are one sequential worker in MWStudios Website Factory Autopilot.
The user authorized AUTOMATIC creation of this entire local WordPress site from factory:init.
Work autonomously in THIS theme and its own WordPress instance only: https://autopilot.local.
Never touch other sites, sibling themes, old autopilot copies, git history, production, credentials, or deployments.
Do not launch agents or another autopilot. Read AGENTS.md and factory/project.json first.
The actual current project is RudnikAgro. Ignore example brand names, dimensions and languages in legacy docs.
Use the current project's enabled capabilities and languages. Install required missing WordPress plugins via native WP-CLI when needed.
Use node scripts/factory/autopilot/wp.js <wp arguments> for THIS LocalWP site's PHP/ini/database.
Do not implement fake forms or payments; never send external email, place real orders or charge a payment in QA.
User's final implementation rules: sticky header; existing spacing utilities pt-*, pb-* etc in section markup
(extend existing spacing value generator for exact needed values); ONE SCSS file PER PAGE, shared global/header/footer separate.
PHP/ACF/SCSS/vanilla JS, existing grid/partials first. No React/Tailwind, no clamp typography, no placeholder imagery.
All visible copy/media must be native editable ACF/WordPress content, no hardcoded project copy or fallback copy.
Native ACF Local JSON with section tabs, imported into ACF admin. Present field structure in docs before creating fields.
Idempotent importer only touches records owned by this project. Preserve subsequent editor changes on resume.
No invented design facts, text, translations, links, product data, screenshots, fixtures or test data.
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
Task: {"id":"detail-checkout","scope":"group","buildGroup":"checkout"}.


DETAILED SNAPSHOT FOR ASSIGNED BUILD GROUP ONLY: checkout.
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
Run node scripts/factory/autopilot/gates.js group checkout; fix all group-specific failures before returning.
Only stop blocked for an actual unavailable visual source after finishing all accessible parts; ordinary incomplete work is needs_work.
