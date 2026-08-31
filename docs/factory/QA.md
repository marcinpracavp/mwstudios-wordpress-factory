# Website Factory QA

`npm run factory:qa` is the deterministic browser-capture gate for Website Factory. It runs from the terminal and does not depend on an in-app browser tool. It uses `playwright-core` with an installed system Chrome or Edge; it does not download Playwright's bundled Chromium.

Visual QA may not be declared complete unless browser screenshots were successfully captured.

## Configuration

`factory/qa.json` contains the developer-only QA matrix:

- `routes`: named paths to open;
- `languages`: language code to URL-path mapping;
- `viewports`: named width and height pairs.

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
  sections/
```

`summary.json` is machine-readable and records browser, project, base URL, selected matrix, checks, errors, warnings, and generation time. A small tracked overview is written to `docs/factory/project/QA_REPORT.md` after a browser run.

## Checks

Factory captures full-page screenshots and records viewport/document/body dimensions, scroll dimensions, and horizontal overflow. Overflow is `FAIL` when `documentElement.scrollWidth` is more than one pixel wider than `documentElement.clientWidth`.

It records `console.error`, `console.warning`, `pageerror`, failed requests, and broken `<img>` elements (`!complete` or `naturalWidth === 0`). Console warnings are reported but do not fail QA. Console errors, page errors, broken images or failed image requests, fatal page HTTP failures, browser crashes, missing browser, and unavailable `environment.localUrl` fail QA.

When markup exposes `[data-factory-section]`, Factory records each section's ID and x/y/width/height, and captures each element to `sections/`. No section markup is required. With `--section`, Factory still opens the selected pages but captures only that section; an unknown section is a warning, not a crash.

## Filters

All filters are optional and use IDs from `factory/qa.json`:

```powershell
npm run factory:qa -- --route home
npm run factory:qa -- --viewport desktop
npm run factory:qa -- --lang pl
npm run factory:qa -- --section hero
```

Factory does not crawl or click arbitrary links: it analyses only configured routes.
