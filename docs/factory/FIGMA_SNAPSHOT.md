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
  design-system.json
  components.json
  content-map.json
  sections/
  references/
    full/
    sections/
  assets/
    references/
```

Only `manifest.json` and `pages.json` are created by `prepare`; the discovery agent adds the remaining compact artefacts. `.factory-cache/` is already ignored by Git.

## Discovery and capture procedure

1. Run `prepare` after a valid Figma URL exists.
2. Load the `figma-use` skill and enumerate `figma.root.children` in read-only mode. Do not rely on root `get_metadata(fileKey)`, which can omit pages.
3. Read metadata for every discovered `PAGE`, build the concise page and frame inventory, and make the global design pass before coding.
4. Write compressed implementation facts to the snapshot. Do not save raw MCP responses, generated React/Tailwind code, full Figma trees, XML dumps, base64 images, or client assets.
5. Save a desktop/mobile reference for every logical section and full-frame desktop/mobile references when those frames exist.
6. Mark the manifest `partial` until all implementation data is ready; mark it `complete` only when `factory:figma:validate` passes.

Logical section granularity is Header, Hero, About, Services, Benefits, Testimonials, CTA, Contact, Footer -- neither individual buttons nor an entire homepage as one record.

## Manifest contract

`manifest.json` is the map of the snapshot. Its required top-level fields are `snapshotVersion`, `status`, `source`, `capturedAt`, `pages`, `frames`, `sections`, `languages`, `viewports`, `globalEffects`, and `warnings`. `source` holds `fileKey` and `figmaUrl`.

`pages.json` duplicates only the concise `manifest.pages` inventory, for example page ID, name, `PAGE` type, and purpose. `frames` lists only the concrete node IDs that support saved sections, language variants, full references, or global effects; it is not a complete Figma tree.

Each manifest section has an ID, human name, positive order, page ID, `sections/<order>-<id>.json` snapshot path, desktop/mobile node IDs, and desktop/mobile reference paths. Node IDs referenced by a section or global effect must appear in `frames`. The section ID is the future `data-factory-section` value.

Multi-language support follows `factory/project.json` rather than hardcoding PL/EN. `manifest.languages` exactly matches `wordpress.languages`. Shared geometry remains one desktop/mobile pair. When a language has separate Figma frames, add `variants.<language>.desktopNodeId`, `mobileNodeId`, `desktopReference`, and `mobileReference` without duplicating shared geometry.

`globalEffects` lists cross-section effects such as a glow, continuous gradient, decorative SVG, shared shadow, sticky background, or overlap. Each effect records an ID, two or more affected section IDs, description, and node ID.

## Section and supporting contracts

Each section JSON includes its ID, name, order, source page and desktop/mobile node IDs, desktop/mobile geometry, layout, and `liveFigmaRequired`. Add only applicable typography, colors, effects, content fields, assets, components, overlaps, and notes. It captures implementation facts, not generated code.

`design-system.json` is compact implementation data: viewports, containers, grid, colors, typography (family, weight, style, font size, line height, letter spacing), spacing, radii, borders, shadows, effects, buttons, links, forms, and breakpoints. `components.json` records reusable components and variants with IDs, node IDs, names, types, and sections that use them. `content-map.json` maps source content keys to a section, type, and per-language content for later one-time ACF/WordPress import.

## References and QA

Section references live under `references/sections/` and are the pixel-QA baseline for one section. Full desktop/mobile references live under `references/full/` and are the global-composition baseline. Their counterparts are QA captures in `.factory-cache/qa/latest/`; Factory V1 records both sides but does not yet compute automatic image diffs.

`factory:figma:status` reports only counts, source, declared status, languages, reference counts, and missing artefacts. `factory:figma:section -- --id <id>` is navigation-only: it prints the section paths and node IDs, never the whole JSON into terminal context.

`factory:figma:validate` is offline. It validates the manifest and section schemas, complete status, source, unique page/section IDs and section order, page/node references, references on disk, desktop/mobile completeness, project-language consistency, and required design-system/components/content-map artefacts. It never checks live Figma.

If a screenshot and JSON disagree, an object position or gradient is unclear, a component variant is absent, the design changed, or browser QA finds an unexplained gap, inspect only the affected Figma section node. Update its JSON/reference files before continuing.
