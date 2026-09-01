# Website Factory QA

`npm run factory:qa` is the deterministic browser-capture gate for Website Factory. It runs from the terminal and does not depend on an in-app browser tool. It uses `playwright-core` with an installed system Chrome or Edge; it does not download Playwright's bundled Chromium.

Visual QA may not be declared complete unless browser screenshots were successfully captured.

## Configuration

`factory/qa.json` contains the developer-only QA policy and fallback matrix:

- `routePlan`: validated site-map source and manual-route preservation policy;
- `routes`: pre-discovery fallback routes and explicit manual routes;
- `languages`: language code to URL-path mapping;
- `viewports`: Factory minimum/manual width and height pairs;
- `interactions`: project-specific declarative Playwright recipes.

After discovery, `npm run factory:qa:plan` resolves the real route matrix from validated `.factory-cache/figma/latest/site-map.json`. Each resolved route has an ID, canonical path, site-map page ID, route type, per-language canonical paths, reference viewports, reference mode, and ownership. Manual routes are preserved; fallback/site-map routes are replaced deterministically in memory and `factory/qa.json` is not arbitrarily rewritten by an agent.

Actual Figma source widths are merged with the minimum responsive widths 1440, 1280, 1024, 768, 390, and 375. Project language configuration remains authoritative.

The base URL always comes from `factory/project.json` → `environment.localUrl`. It is intentionally not duplicated in `qa.json`. When it is not configured, QA fails with `Factory QA requires environment.localUrl.` and never guesses a LocalWP domain.

`factory:validate` validates `factory/qa.json` against `factory/schemas/qa.schema.json` alongside the existing Factory manifests.

## Browser discovery

The discovery order is:

1. `FACTORY_BROWSER_PATH`;
2. standard Google Chrome paths, including the user-local installation;
3. standard Microsoft Edge paths, including the user-local installation;
4. `where.exe` on Windows (or `which` on other systems).

To select a browser explicitly in PowerShell:

```powershell
$env:FACTORY_BROWSER_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run factory:qa
```

If no browser is found, Factory lists every environment, Chrome, Edge, and PATH check before exiting non-zero.

## Capture and output

Before each capture the runner waits for DOM content, `document.fonts.ready`, a bounded `networkidle` wait, and image completion. It injects temporary reduced-motion CSS and creates a Playwright context with `prefers-reduced-motion`; source SCSS and WordPress runtime are untouched.

The current run replaces only `.factory-cache/qa/latest/`, which is Git-ignored. Each language/route/viewport contains:

```text
.factory-cache/qa/latest/<lang>/<route>/<viewport>/
  full.png
  metrics.json
  console.json
  network.json
  sections.json
  interactions.json
  sections/
```

`summary.json` is machine-readable and records a QA run ID, browser, project, base URL, resolved plan state, selected matrix, passive checks, action-level interaction results, errors, warnings, source fingerprint, build fingerprint, matrix fingerprint, and generation time. A small tracked overview is written to `docs/factory/project/QA_REPORT.md` after a browser run.

## Checks

Factory captures full-page screenshots and records viewport/document/body dimensions, scroll dimensions, and horizontal overflow. Overflow is `FAIL` when `documentElement.scrollWidth` is more than one pixel wider than `documentElement.clientWidth`.

It records `console.error`, `console.warning`, `pageerror`, failed requests, and broken `<img>` elements (`!complete` or `naturalWidth === 0`). Console warnings are reported but do not fail QA. Console errors, page errors, broken images or failed image requests, fatal page HTTP failures, browser crashes, missing browser, and unavailable `environment.localUrl` fail QA.

When markup exposes `[data-factory-section]`, Factory records each section's ID and x/y/width/height, and captures each element to `sections/`. No section markup is required. With `--section`, Factory still opens the selected pages but captures only that section; an unknown section is a warning, not a crash.

## Deterministic interaction recipes

Recipes run only on configured route/language/viewport targets and support `click`, `fill`, `submit`, `press`, bounded `wait`, `assertVisible`, `assertUrl`, `assertText`, `assertCount`, `assertAttribute`, `assertTagName`, `assertFocused`, `assertAccessibleName`, and `assertNoConsoleError`.

Every action produces PASS/FAIL evidence in `interactions.json`. Functional QA derives required recipe domains from actual validated capabilities and navigation. Passive captures cannot certify menu open/close, switching, form submission, slider controls, search, cart, checkout, or account behavior.

Every real site-map page also requires one `semantic-baseline` recipe. It deterministically checks one logical H1 and the applicable stable selectors for control tag semantics, accessible form names, image alt intent, and decorative icon hiding. Where those existing components occur, the same recipe verifies menu `aria-expanded`, accordion/tab keyboard state, and retained/managed focus. It does not require absent components and is not a full WCAG audit framework.

## Final evidence freshness

Before the read-only final reviewer, Autopilot runs build and the complete current browser matrix. `qa-evidence-freshness` recomputes source/build/matrix fingerprints and verifies every expected route/language/viewport capture, zero QA errors, and the current run ID. Any source or build change after capture invalidates the evidence. Audit-fix refreshes evidence again before re-audit.

## Filters

All filters are optional and use IDs from `factory/qa.json`:

```powershell
npm run factory:qa -- --route home
npm run factory:qa -- --viewport desktop
npm run factory:qa -- --lang pl
npm run factory:qa -- --section hero
```

Factory does not crawl or click arbitrary links: it analyses only configured routes.
