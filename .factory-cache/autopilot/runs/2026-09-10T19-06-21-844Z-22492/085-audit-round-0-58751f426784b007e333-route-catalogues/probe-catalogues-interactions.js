const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser'));

async function main() {
  const outputPath = process.argv[2];
  if (!outputPath) throw new Error('Expected an output JSON path.');

  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported local browser was found.');

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'pl-PL',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || null });
  });

  const response = await page.goto('https://autopilot.local/katalogi/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.locator('.c-catalogues-downloads').waitFor({ state: 'visible', timeout: 10000 });

  const observation = await page.evaluate(() => {
    const section = document.querySelector('.c-catalogues-downloads');
    const actions = [...section.querySelectorAll('.c-catalogue-card__action')].map((element, index) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        index,
        tagName: element.tagName,
        text: element.textContent.replace(/\s+/g, ' ').trim(),
        href: element.getAttribute('href'),
        download: element.hasAttribute('download'),
        role: element.getAttribute('role'),
        tabIndex: element.tabIndex,
        visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    });
    return {
      url: location.href,
      title: document.title,
      sectionCount: document.querySelectorAll('.c-catalogues-downloads').length,
      cardCount: section.querySelectorAll('.c-catalogue-card').length,
      actionCount: actions.length,
      actionableControlCount: section.querySelectorAll('a, button, input, select, textarea, [role="button"]').length,
      actions
    };
  });

  const result = {
    generatedAt: new Date().toISOString(),
    browser: discovery.browser.name,
    responseStatus: response ? response.status() : null,
    ...observation,
    pageErrors,
    consoleErrors,
    failedRequests
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({
    browser: result.browser,
    responseStatus: result.responseStatus,
    sectionCount: result.sectionCount,
    cardCount: result.cardCount,
    actionCount: result.actionCount,
    actionableControlCount: result.actionableControlCount,
    actionTags: result.actions.map((action) => action.tagName),
    actionHrefs: result.actions.map((action) => action.href),
    pageErrors: result.pageErrors.length,
    consoleErrors: result.consoleErrors.length,
    failedRequests: result.failedRequests.length
  }));

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
