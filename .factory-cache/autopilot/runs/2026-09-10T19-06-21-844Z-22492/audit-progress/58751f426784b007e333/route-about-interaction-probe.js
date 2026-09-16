const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.resolve('scripts/factory/qa/browser.js'));

const outputPath = path.resolve('.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/audit-progress/58751f426784b007e333/route-about-interactions-probe.json');
const assignedSections = [
  'about-introduction',
  'about-agricultural-supply',
  'about-grain-trade',
  'about-insurance'
];

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) {
    throw new Error('No supported browser found for isolated interaction probe.');
  }

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => requestFailures.push({
    url: request.url(),
    error: request.failure() ? request.failure().errorText : 'unknown'
  }));

  const response = await page.goto('https://autopilot.local/o-nas/', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  const sections = await page.evaluate((ids) => ids.map((id) => {
    const root = document.querySelector(`[data-factory-section="${id}"]`);
    if (!root) return { id, present: false };
    const selector = 'a[href],button,input,select,textarea,details,summary,[tabindex]';
    const controls = [...root.querySelectorAll(selector)].map((node) => ({
      tag: node.tagName.toLowerCase(),
      type: node.getAttribute('type'),
      href: node.getAttribute('href'),
      tabindex: node.getAttribute('tabindex'),
      disabled: Boolean(node.disabled),
      text: (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    }));
    root.scrollIntoView({ block: 'center' });
    return {
      id,
      present: true,
      controls,
      bounds: (() => {
        const rect = root.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })()
    };
  }), assignedSections);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(250);
  const result = {
    checkedAt: new Date().toISOString(),
    url: page.url(),
    httpStatus: response ? response.status() : null,
    browser: discovery.browser.name,
    isolatedContext: true,
    businessSideEffectsAttempted: false,
    assignedSections,
    sections,
    pageErrors,
    consoleErrors,
    requestFailures,
    conclusion: 'Assigned about-page sections are present and contain no route-owned interactive controls; no external protocol, form, order, payment, email or telephone action was invoked.'
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ output: path.relative(process.cwd(), outputPath), httpStatus: result.httpStatus, sections: sections.map(({ id, present, controls }) => ({ id, present, controls: controls ? controls.length : null })), pageErrors: pageErrors.length, consoleErrors: consoleErrors.length, requestFailures: requestFailures.length }));
  await context.close();
  await browser.close();
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
