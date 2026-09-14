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
Read the compact handoff before exploring. Never read historical events.jsonl or whole previous prompts to rebuild context.
Limit shell output to relevant facts (usually under 2000 tokens). Persist large extraction results directly to files.
For large scripts use apply_patch to write a project scratch script, then execute it; avoid giant inline Windows commands.
If view_image cannot load a huge full-page PNG, use node scripts/factory/autopilot/image-preview.js <theme-relative-file> <label>
for an inspection thumbnail, or add x y width height for an exact 1x crop. Original references remain unchanged.
Do not dump raw MCP, base64, generated React or whole Figma trees. Persist compact facts immediately.
Use existing snapshot and artifacts on retry; finish remaining work, never restart completed sections without a measured regression.
The final response follows the output schema: status passed/needs_work/blocked, summary, evidence file paths, concrete remaining issues.
A successful command or screenshot existence is NOT proof of visual fidelity. Never fabricate PASS.
Run directory: .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492.
Task: {"id":"detail-home","scope":"group","buildGroup":"home","routes":[{"id":"home-active","path":"/","language":"pl","frameNodeId":"250:115","reference":"references/full/frame-250-115.png","width":1920,"height":8999,"sections":["shared-topbar","shared-secondary-navigation","shared-primary-navigation-active","home-hero","home-benefits","home-crop-selection","home-promotions","home-bundles","home-catalogues","home-recommended","home-about","home-blog","home-knowledge","shared-footer"],"buildGroup":"home","responsiveSource":"derived","notes":"Source explicitly names active elements and the primary menu group extends from 78.676 to 417 px. Planned local route path is an implementation decision inferred from source page identity, not a captured source hyperlink. Uncaptured section IDs remain explicit in this partial execution plan.","state":"active-elements","sectionGeometry":{"shared-primary-navigation-active":{"x":240,"y":115,"width":1440,"height":417},"home-hero-active":{"x":40,"y":195,"width":1840,"height":800},"home-crop-selection-active":{"x":0,"y":1383,"width":1920,"height":1033},"home-promotions-active":{"x":174,"y":2504,"width":1574,"height":724}}},{"id":"home","path":"/","language":"pl","frameNodeId":"12:2","reference":"references/full/home.png","width":1920,"height":8999,"sections":["shared-topbar","shared-secondary-navigation","shared-primary-navigation","home-hero","home-benefits","home-crop-selection","home-promotions","home-bundles","home-catalogues","home-recommended","home-about","home-blog","home-knowledge","shared-footer"],"buildGroup":"home","responsiveSource":"derived","notes":"Source strona glowna is the full default homepage composition. Planned local route path is an implementation decision inferred from source page identity, not a captured source hyperlink. Uncaptured section IDs remain explicit in this partial execution plan.","sectionGeometry":{"shared-primary-navigation":{"x":240,"y":115,"width":1440,"height":78.6761245727539},"shared-topbar":{"x":0,"y":0,"width":1920,"height":40},"shared-secondary-navigation":{"x":239,"y":56,"width":1440.9998779296875,"height":42},"home-benefits":{"x":240,"y":1106,"width":1440,"height":175},"home-crop-selection":{"x":0,"y":1383,"width":1920,"height":1033},"home-promotions":{"x":174,"y":2504,"width":1574,"height":724},"home-bundles":{"x":174,"y":3316,"width":1574,"height":724},"home-catalogues":{"x":240,"y":4127,"width":1440,"height":384},"home-recommended":{"x":173.00003051757812,"y":4578,"width":1574,"height":724},"home-about":{"x":0,"y":5434,"width":1920,"height":850},"home-blog":{"x":236,"y":6401,"width":1457,"height":668},"home-knowledge":{"x":0,"y":7023,"width":1920,"height":1273},"shared-footer":{"x":0,"y":8363,"width":1920,"height":636},"home-hero":{"x":40,"y":195,"width":1840,"height":800}}}]}.


DETAILED SNAPSHOT FOR ASSIGNED BUILD GROUP ONLY: home.
Global inventory/full references already exist. Do not enumerate pages/frames again or reread unrelated routes.
Read AUTOPILOT.md snapshot contract, manifest, design-system, observations/index.json, and existing relevant section files.
Read docs/factory/project/CAPTURE_REMAINING.json if present as an index of remaining work; actual manifest and source win.
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
Run node scripts/factory/autopilot/gates.js group home; fix all group-specific failures before returning.
Only stop blocked for an actual unavailable visual source after finishing all accessible parts; ordinary incomplete work is needs_work.

Read this compact handoff FIRST: .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/007-discovery-detail-home/handoff.json.
