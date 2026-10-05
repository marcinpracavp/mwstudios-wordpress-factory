# MWStudios WordPress Factory Autopilot

Autopilot converts an audited Figma file into a classic, editable WordPress
theme built with PHP, ACF, SCSS and the repository's existing JavaScript and
Webpack setup. Figma is visual authority; generated framework code is never
copied into production.

## Start a project

```bash
npm run factory:init
npm run factory:validate
npm run factory:autopilot -- plan
npm run factory:autopilot:check
npm run factory:autopilot
```

`factory:init` must provide the project identity, local WordPress URL, Figma
URL, languages and enabled capabilities. The repository is intentionally
neutral before initialization.

All source snapshots, plans, attempts, screenshots, comparisons, audit
checkpoints and final reports live under `.factory-cache/`. That directory is
ignored by Git and must not be included in a website export.

## Route-first workflow

Autopilot uses this order:

1. Inventory every top-level Figma frame and classify it as production page,
   interaction state, archive/research material or component.
2. Audit every production/state frame as a complete composition. Persist its
   exact 1x full-page reference, canvas order, section boundaries, content,
   assets and geometry.
3. Compare all audited routes before implementation. Produce a frozen plan of
   shared structures, canonical pages and state deltas.
4. Build foundation and native editable content.
5. Build shared components once.
6. Build one canonical page at a time and run a fresh full-page gate. A route
   that misses the gate after its bounded build turns is checkpointed with its
   measured evidence for the later diagnosis cycle instead of being rebuilt in
   an open-ended loop.
7. Build interaction states as deltas over their implemented canonical pages.
   Inherited base-page findings stay owned by the canonical route and are not
   rebuilt as part of the state.
8. Diagnose failed full-page comparisons and only then issue section-scoped
   repair tasks.
9. Run a fresh whole-site deterministic comparison and independent audit.

Implementation cannot start until the complete source snapshot and execution
plan are frozen.

## Structural reuse

Reuse is based on normalized structure, not Figma node names or copy. Layout
direction/tree, semantic field roles, media roles/aspect ratios, controls,
backgrounds and repeaters form the signature.

For example, two sections with the same background + heading/body + button
layout are one reusable CTA with different field values. Different copy, image
or node IDs alone do not create a new component. Autopilot only promotes a
pattern automatically when it has sufficient structural evidence on distinct
canonical routes; a duplicate interaction-state frame is not evidence of a
second component.

## Interaction states

A frame showing an open popup, modal, menu, drawer, accordion or active tab is
an interaction specification for its canonical route. Exact matching sections
are reused. Only added, changed and removed regions enter the state task.

The real UI state must be reproducible through an idempotent
`scripts/factory/project/qa-state.js` hook. Screenshot-only DOM injection,
synthetic orders, payments or business history are forbidden. Missing genuine
data remains an explicit source dependency and can never be called PASS.

## Snapshot contract

The frozen snapshot is `.factory-cache/figma/latest/` and contains:

- `manifest.json` with every production route/state and ordered sections;
- exact full-frame and section PNG references;
- section JSON records with source-node identity, geometry and layout facts;
- `content-map.json` with exact editable content and intended native/ACF
  ownership;
- source assets with provenance;
- design-system and component facts;
- `implementation-plan.md`.

`manifest.routes[].runtime.kind` may explicitly declare `page`,
`posts-archive`, `post`, `product`, `product-archive` or `declared`. Runtime
behavior is never inferred from a familiar route ID.

## WordPress implementation rules

- Inspect existing partials, utilities, fields and JavaScript modules first.
- Use semantic PHP/HTML, WordPress escaping and editor-owned ACF/native data.
- Use one logical H1 per page.
- Prefer existing grid and spacing utilities.
- Build reusable partials for genuine repeated structure; use data variants
  for content differences.
- Do not hardcode upload URLs, editable content or page-height spacers.
- Do not add React, Tailwind or a generic page builder.
- Project adapters are generated from the frozen plan and must remain scoped,
  idempotent and preserve editor overrides.

## Acceptance

The default visual policy is 4% maximum effective page mismatch, 24/255
channel tolerance and 2px geometry tolerance. A route task starts from the
full-page reference. Section crops are diagnostics and repair scopes, not a
replacement for whole-page acceptance.

Missing the full-page threshold is never treated as acceptance. After the
bounded route/state build turns, current measurements enter the whole-site
diagnosis loop, which issues scoped repairs and recaptures the complete page.
The loop has a finite repair-pass limit, one route-level no-progress polish and
one final independent audit; unresolved evidence ends in human review rather
than another blind retry.

Full acceptance also requires:

- exact route/section semantic coverage;
- loaded images and fonts, no runtime errors or horizontal overflow;
- healthy configured responsive widths;
- real interaction-state preparation;
- verified native content/integrations when selected;
- an independent review of current reference/render/diff evidence.

Thresholds, source snapshots and engine files are protected from workers.
Missing evidence is never PASS.

## Resume and evidence

```bash
npm run factory:autopilot:status
npm run factory:autopilot:stop
npm run factory:autopilot:resume
```

Every task is bound to source, instructions, thresholds and implementation
hashes. Valid checkpoints survive interruption; changed inputs invalidate only
the affected derived work. Each run keeps its own `REPORT.md`, execution plan,
attempt logs, comparisons, audit ledger and final report under
`.factory-cache/autopilot/runs/<run-id>/`.

## Verification

```bash
npm run factory:autopilot:test
npm run build
```

The automated suite covers structural reuse, state deltas, route-first
discovery, checkpointing, native fail-closed verification, routing, visual
diagnostics and host resume behavior. The optional live smoke uses model and
browser capacity and is not production-site acceptance.
