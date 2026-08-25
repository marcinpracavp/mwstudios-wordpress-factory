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
