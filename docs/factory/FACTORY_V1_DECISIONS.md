# Website Factory v1 Decisions

Status: **FROZEN for Factory v1**

## Platform

- WordPress custom theme
- PHP templates
- ACF Pro enabled by default as a configurable project requirement
- SCSS
- Vanilla JavaScript
- Webpack
- LocalWP
- Windows support required

## Rendering

Factory v1 uses fixed PHP templates, reusable partials/components, and ACF-defined content.

ACF Flexible Content is not part of the default Factory v1 architecture.

## Capabilities

Initializer defaults:

- `acf`
- `swiper`

Optional capabilities:

- `cf7`
- `polylang`
- `woocommerce`
- `swiper`
- `aos`
- `lenis`
- `google-maps`
- `blog`
- `topbar`
- `promo-popup`

Capability flags describe the technologies, integrations, and features planned for a project. They provide context for Codex and development tooling; they do not activate a PHP runtime loader, control WordPress requests, or authorize removing disabled functionality from the boilerplate.

ACF Pro defaults to enabled during project initialization but remains a configurable project-context flag. The `lenis` flag means that the project plans to use Lenis as its smooth-scrolling engine. It does not install Lenis or implement smooth scrolling in the WordPress runtime.

The ACF Pro license is configured by the MWStudios boilerplate and is never an operator credential blocker. A missing plugin binary/package remains a separate technical dependency.

Excluded from the v1 core:

- Viewer
- AOE
- TwentyTwenty
- FullCalendar
- project-specific APIs
- project-specific CPTs and taxonomies

## Figma

Figma MCP is the design source. Figma data informs implementation, but production code follows the Factory contracts and the existing WordPress architecture.

Project topology defaults to `auto`. Discovery resolves real `onepage`, `multipage`, or `hybrid` topology in the validated compact site map; Figma PAGE nodes remain design-file containers and are not treated as routes.

## Workflow

The frozen Factory v1 workflow is:

```text
DISCOVERY
FIGMA_ANALYSIS
COMPONENT_MAP
ACF_PLAN
IMPLEMENTATION_PLAN
IMPLEMENTATION
RESPONSIVE
BUILD
STATIC_QA
VISUAL_QA
FUNCTIONAL_QA
READY_FOR_STAGING
HUMAN_APPROVAL
DEPLOY
```

Production deployment always requires explicit human approval. Reaching `READY_FOR_STAGING` does not authorize deployment.

## Release contract

Status: **FROZEN FOR FACTORY V1**

- `dist/` is generated locally by the production build and is always included in the release uploaded to hosting.
- `src/` is always included in the release uploaded to hosting.
- `vendor/` is always included in the release uploaded to hosting.
- `node_modules/` is never included in the release.
- `.git/` is never included in the release.
- Hosting does not run `npm install`, `npm ci`, Composer, or Webpack.
- A release is a self-contained WordPress theme prepared locally before deployment.

## Source Of Truth

| Source | Authority |
|---|---|
| `factory/project.json` | project configuration source of truth |
| `factory/capabilities.json` | available capabilities source of truth |
| `factory/schemas/*` | machine-readable contracts |
| `AGENTS.md` | agent behavior |
| `docs/factory/*` | architecture and workflow documentation |
| `package.json` + `webpack.config.js` | actual build behavior |
| `acf-json/*` | actual ACF Local JSON definitions |
| `src/*` | frontend source |
| `dist/*` | generated output |

## Autopilot extension

Factory Autopilot is an additive control-plane layer. Its configuration, profiles, prompts, state machine, gates, resume behavior, plugin policy, and safety contract are documented in `docs/factory/FACTORY_AUTOPILOT.md`.

The manual Factory v1 commands and release contract remain valid without Autopilot. Autopilot never authorizes deployment, Git history mutation, or removal of disabled boilerplate capabilities.
