# MWStudios Website Factory Autopilot

Factory Autopilot is an orchestration layer on top of the existing Website Factory. It does not replace the manual workflow, Figma snapshot commands, Factory validator, Webpack build, or browser QA.

The intended operator workflow is:

```powershell
npm ci
npm run factory:init
npm run factory:autopilot -- --dry-run
npm run factory:autopilot
```

A dry run never starts Figma discovery, implementation, plugin mutations, browser QA, or an agent session.

## Architecture

```text
factory/agents/
  autopilot.json                 pipeline, policies, limits, runner
  profiles.json                  logical roles and runtime model mapping
  plugins.json                   capability-to-WordPress-plugin strategy
  prompts/                       reusable project-neutral prompts
  schemas/                       config and structured-result contracts

scripts/factory/agents/
  orchestrator.js                CLI and resumable pipeline
  runner.js                      fresh Codex session runner
  state.js                       run ID, state, resume, compact event log
  gates.js                       deterministic command gates
  plugin-manager.js              idempotent WP-CLI plugin handling
  conventions.js                spacing/page-style/SCSS static policy
  reporting.js                  dashboards and final/audit reports
  validate-autopilot.js          static Autopilot validation

.factory-cache/agents/
  current.json                   pointer to the active run
  runs/<run-id>/state.json       compact stage state
  runs/<run-id>/events.jsonl     compact events, not raw transcripts
  runs/<run-id>/results/         structured agent results
  runs/<run-id>/reports/         compact final reports
```

`.factory-cache/agents/` is local and Git-ignored. A successful real run also writes tracked summaries to `docs/factory/project/FINAL_VISUAL_AUDIT.md` and `docs/factory/project/AUTOPILOT_REPORT.md`.

## Manual workflow

All existing commands remain independently usable:

```powershell
npm run factory:init
npm run factory:context
npm run factory:validate
npm run factory:figma:prepare
npm run factory:figma:validate
npm run factory:figma:status
npm run factory:figma:section -- --id <section-id>
npm run factory:qa
npm run build
```

Autopilot state is not required by these commands.

## Autopilot workflow

The configured pipeline is:

```text
PRE-FLIGHT
FIGMA DISCOVERY
SNAPSHOT + SITE MAP VALIDATION / DISCOVERY REPAIR
REQUIRED PLUGINS
ARCHITECTURE / IMPLEMENTATION
BUILD / IMPLEMENTATION REPAIR
SECTION QA
VISUAL CORRECTION
FULL PAGE QA
RESPONSIVE CORRECTION
LANGUAGE CORRECTION (configured multilingual projects only)
FUNCTIONAL QA / CORRECTION
FINAL EVIDENCE REFRESH
INDEPENDENT FINAL VISUAL AUDIT
FIX AUDIT FINDINGS
FRESH RE-AUDIT
FINAL REPORT
```

Agent text cannot advance a deterministic gate. The orchestrator executes the configured commands and evaluates their actual exit codes/results.

The IMPLEMENTER completes required importer execution and WordPress runtime bootstrap before the first browser QA stage. When seeding is required, the importer is statically validated, executed through the resolved LocalWP PHP/WP-CLI toolchain, verified against the resulting native WordPress state, executed a second time, and checked for idempotency before visual QA. It never resets the database or removes unrelated content. Runtime bootstrap uses native WordPress/plugin configuration for front/posts page settings, templates, menus, rewrites, Polylang, WooCommerce/form relationships, and global options when those capabilities are present; routing hacks are not a substitute.

## Agent profiles and model mapping

Logical roles are separate from runtime identifiers in `factory/agents/profiles.json`:

| Profile | Role | Logical model | Default runtime model | Effort | Sandbox |
| --- | --- | --- | --- | --- | --- |
| `discovery` | DISCOVERY | terra | `gpt-5.6-terra` | high | workspace-write |
| `implementer` | IMPLEMENTER | terra | `gpt-5.6-terra` | high | workspace-write |
| `corrector` | CORRECTOR | terra | `gpt-5.6-terra` | high | workspace-write |
| `auditFixer` | AUDIT_FIXER | terra | `gpt-5.6-terra` | high | workspace-write |
| `finalReviewer` | FINAL_REVIEWER | sol | `gpt-5.6-sol` | high | read-only |
| `escalation` | ESCALATION | sol | `gpt-5.6-sol` | max | read-only |

These identifiers and effort levels were verified locally with `codex-cli 0.144.6` and `codex debug models`. Change mapping in one file or override it without editing the pipeline:

```powershell
$env:FACTORY_CODEX_MODEL_TERRA="<verified-terra-model>"
$env:FACTORY_CODEX_MODEL_SOL="<verified-sol-model>"
```

Do not enter guessed model identifiers.

## Fresh sessions and result contract

Every agent invocation uses a new `codex exec --ephemeral` session with approval prompts disabled and shell network access explicitly disabled. The Codex workspace sandbox protects `.git` as read-only. No `codex exec resume` is used. FINAL_REVIEWER runs read-only and receives the current filesystem, Factory snapshot/config, QA artifacts, compact prior evidence, its own prompt, and nothing from the implementer's conversation.

Every agent result must match `factory/agents/schemas/agent-result.schema.json`:

- `stage`
- `status`
- `summary`
- `changedFiles`
- `issues` with P0/P1/P2/P3 severity and evidence
- `warnings`
- `recommendedNextAction`

The structured result is information. Command exit codes and artifacts remain proof.

## Deterministic gates

Autopilot uses existing scripts wherever possible:

- `npm run factory:validate`
- `npm run factory:autopilot:validate`
- `npm run factory:figma:validate`
- `npm run factory:figma:status`
- `npm run build`
- `npm run factory:qa`
- `git diff --check`
- PHP syntax lint when PHP CLI is available
- responsive QA matrix consistency
- project-language/QA-language consistency
- validated site-map route matrix consistency
- declarative Playwright interaction evidence for actual capabilities
- build/source/matrix fingerprint freshness immediately before final review
- Factory spacing, page-style, and SCSS format conventions

PHP lint uses the central LocalWP toolchain resolver. Resolution order is explicit `FACTORY_*` overrides, executable in `PATH`, project/site configuration, then installed LocalWP services. On Windows it resolves the site record from Local's `sites.json`, the matching bundled PHP service and generated site `php.ini`, then invokes Local's bundled `wp-cli.phar` through that PHP binary. Global `php` and `wp` PATH entries are not required. PHP lint is explicitly `SKIPPED`, never falsely reported as PASS, only when all resolution sources are unavailable.

Explicit overrides are `FACTORY_WORDPRESS_ROOT`, `FACTORY_PHP_PATH`, and `FACTORY_WP_CLI_PATH`. They must point to existing real files/directories; the resolver falls through safely when an override is absent or invalid.

Browser QA provides deterministic HTTP, screenshot, overflow, console/page-error, failed-request, broken-image, font readiness, and section-capture evidence. `factory/qa.json` also supports declarative project-specific Playwright interaction recipes with `click`, `fill`, `submit`, `wait`, `assertVisible`, `assertUrl`, `assertText`, and `assertNoConsoleError`. The functional gate derives required recipe domains from validated site-map capabilities and global navigation, then requires actual action-level PASS evidence. FINAL_REVIEWER never infers interaction success from passive captures.

`FINAL EVIDENCE REFRESH` runs a current production build and complete browser QA matrix before the read-only reviewer. The QA summary records a run ID, source fingerprint, build fingerprint, route/language/viewport matrix fingerprint, and generation time. `qa-evidence-freshness` rejects stale code, stale build output, stale matrix coverage, missing captures, and QA errors. Audit-fix gates refresh and verify evidence again before a fresh re-audit.

## Retry limits and blocking

Defaults in `autopilot.json`:

| Limit | Default |
| --- | ---: |
| discovery repair attempts | 2 |
| implementation repair attempts | 2 |
| section correction loops | 3 |
| audit fix loops | 2 |
| final review attempts | 3 |

After a limit is reached the run becomes `blocked`. State records the stage, reason, remaining issues, attempts, profile, timestamps, results, and gate evidence. Autopilot never loops indefinitely.

## Resume and state

Plain `npm run factory:autopilot` automatically resumes the current non-complete run. A stage left `running` by CTRL+C, a terminal close, PC restart, or Codex interruption is returned to `pending` and retried. Completed stages and accepted QA are not repeated.

Stage state is complemented by `docs/factory/project/STATUS.md`. Implementer/corrector sessions use it as the page/section-level resume contract and continue only unfinished content modeling, backend, import, template, page-style, JavaScript, build, desktop, responsive, language, and functional work.

The run records a fingerprint of project/QA/Figma/Autopilot/profile/prompt configuration. If those inputs change during a run, automatic resume stops instead of trusting stale accepted stages.

After an external blocker has been resolved:

```powershell
npm run factory:autopilot:resume
```

This explicitly reopens the blocked stage and restarts its configured repair allowance. It does not erase prior evidence.

## Reset

Reset is intentionally two-step:

```powershell
npm run factory:autopilot:reset -- --confirm-reset
```

It clears only `.factory-cache/agents/current.json`. It preserves `factory/project.json`, the Figma snapshot, QA artifacts, source code, content, and all historical run directories. It never performs Git reset or deletes project data.

## Dry run

```powershell
npm run factory:autopilot -- --dry-run
```

Dry run prints:

- project and existing resume state;
- configured topology (`AUTO` or explicit), resolved site-map topology, and site-map state;
- resolved stages;
- agent profiles, logical models, runtime models, and effort;
- expected deterministic gates;
- WordPress root, resolved LocalWP PHP invocation, and resolved WP-CLI invocation;
- language, responsive, and route matrix state;
- prompt mapping for every stage and final evidence-freshness gate presence;
- plugin requirements and detected state;
- ACF Pro installed/active status and `licenseConfiguredByBoilerplate=true`;
- configuration fingerprint.

It performs read-only inspection only and does not create Autopilot state.

## Plugin auto-install policy

Plugin requirements come from `factory/project.json`, not section names. `factory/agents/plugins.json` maps supported capabilities:

- `acf` -> Advanced Custom Fields Pro;
- `cf7` -> Contact Form 7;
- `polylang` -> Polylang;
- `woocommerce` -> WooCommerce.

On a real preflight, read-only project, QA-matrix, dependency, Codex-profile, and environment checks must pass before any plugin mutation. After discovery, the dedicated REQUIRED PLUGINS gate also incorporates validated site-map capabilities whose `pluginCapability` is explicitly selected. The central LocalWP toolchain helper then uses WP-CLI idempotently:

1. an active plugin is left unchanged;
2. an installed inactive plugin is activated;
3. an absent wordpress.org plugin is installed and activated;
4. a commercial plugin is installed only from an existing local licensed package;
5. unrelated plugins are never removed, reset, or deactivated.

ACF Pro packages may be placed locally at `factory/plugin-packages/advanced-custom-fields-pro.zip`; ZIP files in that directory are Git-ignored. The helper also recognizes conventional local package locations under `wp-content`. ACF Pro licensing is always treated as configured by the MWStudios boilerplate: no key prompt, generation, or workaround exists. A genuinely missing plugin binary/package remains a technical blocker. Missing WP-CLI blocks only when a concrete required WordPress install/activation action needs it; Autopilot existence and dry-run do not require a global `wp` command.

## Site map, topology, and QA routes

Discovery writes `.factory-cache/figma/latest/site-map.json`, validated by `factory/schemas/site-map.schema.json`. It separates Figma PAGE containers from real website pages and resolves `onepage`, `multipage`, or `hybrid` topology. Operator initialization defaults topology to `auto`; a project may explicitly override it.

Each real website page records route/template/style intent, exact section order, source frames, configured languages/canonical language routes, per-page desktop/mobile source model, and required capabilities. The QA plan is resolved deterministically from a valid complete site map plus preserved manual routes in `factory/qa.json`. Actual Figma widths are merged with the Factory minimum matrix. The LLM does not directly delete route entries during QA.

## Escalation profile

`ESCALATION` remains explicitly `reserved`, not active. The current bounded orchestrator does not execute a Sol escalation loop, and dry-run labels this clearly. It is reserved for a future read-only analysis step after repeated unresolved issues and before human BLOCKED; current retry limits still block deterministically without an infinite loop.

## Global implementation policies

The authoritative inherited rules live in `AGENTS.md` and are reinforced by prompts and validators:

- sticky header by default unless Figma/specification explicitly overrides it;
- exact existing spacing utility before custom spacing;
- Figma accuracy when no exact utility exists;
- `CUSTOM_SPACING_WHERE_UTILITY_EXISTS` static violation;
- one page equals one project page-style file;
- native/dynamic template families share one style file via `templateIntent + styleFile + styleScope`, never one file per entity URL;
- no section SCSS files and no giant all-pages project file;
- readable multiline SCSS with one declaration per line;
- visible project content in ACF, WordPress, or native integration;
- no visible fallback copy;
- native ACF Local JSON;
- same Polylang field schema with separate language values;
- WooCommerce only for real ecommerce;
- final mobile Figma is 1:1 source of truth;
- without final mobile Figma, responsive is derived completely from desktop;
- responsive QA minimum: desktop Figma width, 1440, 1280, 1024, 768, 390, 375.
- every final desktop section node has a saved reference; final mobile/language variants have matching coverage when their source exists;
- every real site-map page has deterministic semantic-baseline interaction evidence for the applicable HTML/keyboard/focus checks.

## Safety

Autopilot does not run `git commit`, `git push`, force checkout, `git reset --hard`, production deployment, or arbitrary deletion. Deployment remains a separate future opt-in workflow with explicit human approval.
