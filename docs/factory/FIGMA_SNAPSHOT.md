# Figma Local Snapshot / Section Cache V1

The local Figma snapshot reduces repeated MCP reads while retaining Figma as the visual source of truth. It is a Git-ignored project cache, not source code and not a substitute for live Figma when a fact is uncertain.

## Commands and ownership

```powershell
npm run factory:figma:prepare
npm run factory:figma:validate
npm run factory:figma:status
npm run factory:figma:section -- --id hero
```

`prepare` reads `factory/project.json` and `factory/figma.json`, validates `figma.url`, extracts the Figma file key, and creates a `prepared` skeleton. It does not have access to Figma MCP and must never pretend to download a design. If `figma.url` is empty, it exits with `Factory Figma snapshot requires figma.url.`

An existing snapshot is protected. Use the explicit `npm run factory:figma:prepare -- --force` only when deliberately discarding the existing cache. The command recreates the cache after the explicit reset. `factory:validate` validates Factory configuration but intentionally does not require an active snapshot, so a clean boilerplate remains valid.

## Cache layout

```text
.factory-cache/figma/latest/
  manifest.json
  pages.json
  site-map.json
  design-system.json
  components.json
  content-map.json
  assets.json
  sections/
  references/
    full/
    sections/
  assets/
    references/
```

Only `manifest.json` and `pages.json` are created by `prepare`; the discovery agent adds the remaining compact artefacts. `pages.json` inventories every Figma `PAGE` container. `site-map.json` separately inventories real website pages/routes. `.factory-cache/` is already ignored by Git.

## Discovery and capture procedure

1. Run `prepare` after a valid Figma URL exists.
2. Load the `figma-use` skill and enumerate `figma.root.children` in read-only mode. Do not rely on root `get_metadata(fileKey)`, which can omit pages.
3. Read metadata for every discovered `PAGE`, build the concise Figma-page/frame inventory, and make the global production-design pass before sections.
4. Resolve real website topology (`onepage`, `multipage`, or `hybrid`) from final production frames, navigation/route semantics, repeated global components, variants, and project configuration.
5. Write `site-map.json` and compressed implementation facts. Do not save raw MCP responses, generated React/Tailwind code, full Figma trees, XML dumps, base64 images, or client assets.
6. Save desktop/mobile/language full references for every real website page with a final production frame, plus relevant section references.
7. Mark the manifest `partial` until all implementation data is ready; mark it `complete` only when `factory:figma:validate` passes.

Logical sections come from the current project in their actual page order. No predetermined section list is applied. A section is neither an individual control nor an entire multipage project in one record.

## Site-map contract

`site-map.json` is the resolved website model, not a copy of Figma PAGE nodes. Its top-level fields are `topology`, `pages`, `globalComponents`, `languages`, `capabilities`, and `warnings`.

Every website page records stable ID/name, slug and canonical route intent, route type, template intent, `styleFile`, and `styleScope`, ordered section IDs, final source frames, configured languages and per-language routes, desktop source frames, per-page mobile mode (`figma`, `derived`, or `mixed-partial`), required capabilities, and notes. `styleScope: page` owns one static website page; `styleScope: template-family` owns one shared native/dynamic view family. Pages with one `templateIntent` and template-family scope must resolve to the same `styleFile`; a product/entity URL never receives its own SCSS file.

Capabilities are evidence-backed and separate from topology. A capability records backend intent and `pluginCapability` only when that integration is selected. Product-like section names alone do not prove ecommerce.

## Manifest contract

`manifest.json` is the map of the snapshot. Its required top-level fields are `snapshotVersion`, `status`, `source`, `capturedAt`, `pages`, `frames`, `sections`, `languages`, `viewports`, `globalEffects`, and `warnings`. `source` holds `fileKey` and `figmaUrl`.

`pages.json` duplicates only the concise `manifest.pages` inventory, for example page ID, name, `PAGE` type, and purpose. `frames` lists only the concrete node IDs that support saved sections, language variants, full references, or global effects; it is not a complete Figma tree.

Each manifest section has an ID, human name, positive order within its real website page, `sitePageId`, source `figmaPageId`, `sections/<order>-<id>.json` path, desktop node/reference, and mobile node/reference when a final mobile source exists. Every final desktop section node requires a local desktop PNG. A page with `mobileSource: figma` requires mobile node/reference coverage for every logical section. A language variant is recorded only when its final node/copy changes visual output such as wrapping or geometry, and then requires its own corresponding reference. Native-derived routes and derived responsive variants explicitly have no invented visual reference. Node IDs referenced by a section or global effect must appear in `frames`. The section ID is the future `data-factory-section` value.

Multi-language support follows `factory/project.json` rather than hardcoding PL/EN. `manifest.languages` exactly matches `wordpress.languages`. Shared geometry remains one desktop/mobile pair. When a language has separate Figma frames, add `variants.<language>.desktopNodeId`, `mobileNodeId`, `desktopReference`, and `mobileReference` without duplicating shared geometry.

`globalEffects` lists cross-page/section effects such as a glow, continuous gradient, decorative SVG, shared shadow, sticky background, or overlap. Each effect records affected website pages and sections, description, source node, and implementation notes.

## Section and supporting contracts

Each section JSON includes its ID, real website page, order, Figma-page and desktop/mobile/language node sources, exact desktop geometry, mobile geometry when present, layout, typography, colors, effects, content fields, `requiredContent`, assets, components, overlaps, notes, and `liveFigmaRequired`. It captures implementation facts, not generated code. A missing final mobile source is represented as `null`, not invented geometry.

`design-system.json` is compact implementation data: exact viewports, containers, grid, colors, typography (family, real weight, style, font size, line height, letter spacing), spacing, radii, borders, shadows, effects, buttons, links, forms, and breakpoints. `components.json` records only implementation-relevant reusable components and page/section use. `content-map.json` covers every real website page and preserves exact per-language visible copy plus backend intent. `assets.json` inventories real source nodes, usage, page/section, and recommended format.

## References and QA

Section references live under `references/sections/` and are the pixel-QA baseline for one section. Full desktop/mobile references live under `references/full/` and are the global-composition baseline. Their counterparts are QA captures in `.factory-cache/qa/latest/`; Factory V1 records both sides but does not yet compute automatic image diffs.

`factory:figma:status` reports only counts, source, declared status, languages, reference counts, and missing artefacts. `factory:figma:section -- --id <id>` is navigation-only: it prints the section paths and node IDs, never the whole JSON into terminal context.

`factory:figma:validate` is offline. It validates manifest, site-map, section, design-system, component, content-map, and asset schemas; complete lifecycle; Figma-page versus website-page relationships; per-page section order; topology override; project languages and canonical language routes; source frames/nodes; template-family style ownership; per-page mobile-source rules; required desktop/mobile/language section-reference coverage; and references on disk. `manifest.status: complete` is rejected when required coverage is incomplete. It never checks live Figma.

If a screenshot and JSON disagree, an object position or gradient is unclear, a component variant is absent, the design changed, or browser QA finds an unexplained gap, inspect only the affected Figma section node. Update its JSON/reference files before continuing.
