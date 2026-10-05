# Figma Implementation Workflow

This document defines the required workflow for Codex and other agents implementing a Figma design in MWStudios Website Factory v1.

## 1. Load Project Context

Read these files before inspecting the design or changing code:

- `AGENTS.md`
- `factory/project.json`
- `docs/factory/PROJECT_CONTEXT.md`

Treat `factory/project.json` as project requirements and implementation context. It does not replace or dynamically configure the WordPress runtime.

## 2. Inspect Figma

Inspect the supplied design through the available Figma tooling or MCP. Identify the relevant pages, frames, components, variants, assets, typography, colors, spacing, and responsive references.

Figma is the visual source of truth. Do not copy generated Figma code directly into the production theme.

## 3. Prepare Before Coding

Before implementation:

1. Inspect the repository and the existing WordPress theme architecture.
2. Identify reusable boilerplate partials, helpers, and components.
3. Identify the existing grid and spacing utilities.
4. Identify existing JavaScript libraries and shared behaviors.
5. Produce a component map that connects Figma sections to reusable or new theme components.
6. Produce an ACF field plan for content-managed sections before creating fields or templates.

## 4. Choose the Implementation Strategy

Use this order for every component:

```text
REUSE
  ↓
EXTEND
  ↓
CREATE
```

Reuse an existing solution when it fits. Extend it when a small, focused change is sufficient. Create a new component only when the required structure or behavior is genuinely different.

## 5. Implement the Design

Implement the supplied design 1:1 using classic WordPress PHP templates, ACF, SCSS, and vanilla JavaScript where interaction requires it. Preserve the established boilerplate architecture and use existing utilities before adding component-specific layout rules.

## 6. Build Responsive Behavior

Implement desktop first according to the supplied Figma frame. Then implement responsive behavior from the available mobile and tablet frames and from the design's layout logic. Use the project's existing breakpoints and responsive systems.

## 7. Respect the Design Source

Do not invent visual design where Figma already defines it. If required design information is missing or ambiguous, report the gap instead of presenting an invented choice as part of the design.

## 8. Preserve the Boilerplate

Preserve boilerplate functionality unrelated to the current implementation. A disabled or unused flag in `factory/project.json` is project context only; it is not an instruction to remove libraries, integrations, helpers, scripts, partials, or other existing functionality.

## 9. Local Snapshot First

The required Factory sequence is:

```text
GLOBAL FIRST -> SECTION INVENTORY -> LOCAL SNAPSHOT CACHE -> SECTION IMPLEMENTATION -> SECTION QA -> FULL-PAGE QA
```

Before code, make one global pass over the whole design: desktop and mobile composition, foundations, reusable components, backgrounds, gradients, glows, shadows, overlaps, decorations, sticky elements, grid, recurring alignment, and section rhythm. A section in isolation can miss an effect that crosses section boundaries.

**Never treat root `get_metadata(fileKey)` as complete Figma discovery.** It can return one page when a file contains many. Load the `figma-use` skill, use the read-only workflow, enumerate `figma.root.children`, then inspect every `PAGE` with `get_metadata(fileKey, pageId)`. Only then use focused design context calls for concrete section nodes.

Do not repeatedly read the entire Figma file during implementation. After discovery, use the local snapshot described in `docs/factory/FIGMA_SNAPSHOT.md`. Node scripts create, inspect, and validate the local cache only; they never call Figma MCP.

For a section, read the project context, `.factory-cache/figma/latest/design-system.json`, the corresponding section JSON, and its desktop/mobile references. Then inspect the boilerplate and apply `REUSE -> EXTEND -> CREATE`.

Before custom CSS, inspect `pt-*`, `pb-*`, `mt-*`, `mb-*`, `gc-*`, `gr-*`, `.l-container`, and other existing utilities. Figma accuracy takes precedence if no utility can express the reference. Keep authored SCSS multiline and section-based in `src/css/pages/<project>/` (for example `_global.scss`, `_header.scss`, `_hero.scss`); do not use one huge page stylesheet. Use exact typography at reference widths and classic media queries, never `clamp()`.

Visible Figma content maps to ACF, WordPress, or a native integration: no hardcoded visible copy and no fallback copy. Project ACF groups are created through ACF Admin and saved as Local JSON in `acf-json/`; whole project groups are not programmatic `acf_add_local_field_group()` defaults. Content-heavy one-page editors use a tab per logical section.

During production implementation, a logical section root uses `data-factory-section="<snapshot-id>"`. This workflow does not change PHP templates itself.

The snapshot is not a prison. Return to Figma only for a specific section node when its snapshot is incomplete or ambiguous, a property is missing, the design changed, or pixel QA exposes an unexplained difference. Update that section snapshot/reference after clarification; do not reread the complete file.

Run `npm run build`, then `npm run factory:qa -- --section <id>`. Compare `.factory-cache/qa/latest/.../sections/<id>.png` with `.factory-cache/figma/latest/references/sections/...`. After section QA, compare full-page QA captures to Figma full-frame references. Factory V1 records both sides but does not yet automate image diffs.
