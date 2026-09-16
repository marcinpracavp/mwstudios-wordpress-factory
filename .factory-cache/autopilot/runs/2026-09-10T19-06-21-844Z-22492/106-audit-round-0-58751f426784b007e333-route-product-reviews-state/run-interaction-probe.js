const fs = require('fs');
const path = require('path');
const { discoverBrowser, formatBrowserDiscoveryFailure, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser.js'));

(async () => {
  const outputDir = path.join(process.cwd(), '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/106-audit-round-0-58751f426784b007e333-route-product-reviews-state');
  const outputPath = path.join(outputDir, 'interaction-probe.json');
  const screenshotPath = path.join(outputDir, 'interaction-reviews-after-click.png');
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error(formatBrowserDiscoveryFailure(discovery.checks));
  const browser = await getChromium().launch({ executablePath: discovery.browser.executablePath, headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 375, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('https://autopilot.local/product/aquatos-5l/#reviews', { waitUntil: 'networkidle' });

  const readState = async () => page.evaluate(() => {
    const product = document.querySelector('.c-product');
    const tabs = [...document.querySelectorAll('[data-product-tab]')];
    const panels = [...document.querySelectorAll('[data-product-panel]')];
    const scroller = document.querySelector('.c-product__tabs');
    const activeTab = document.querySelector('[data-product-tab][aria-selected="true"]');
    const activeRect = activeTab ? activeTab.getBoundingClientRect() : null;
    return {
      hash: location.hash,
      selectedTabs: tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true').map((tab) => tab.dataset.productTab),
      activePanels: panels.filter((panel) => panel.classList.contains('is-active')).map((panel) => panel.dataset.productPanel),
      sectionIdentity: product?.querySelector('.c-product__tabs-content')?.getAttribute('data-factory-section') || null,
      tabScroller: scroller ? {
        clientWidth: scroller.clientWidth,
        scrollWidth: scroller.scrollWidth,
        scrollLeft: scroller.scrollLeft,
        overflowX: getComputedStyle(scroller).overflowX
      } : null,
      activeTabRect: activeRect ? { left: activeRect.left, right: activeRect.right, width: activeRect.width } : null,
      focusedTab: document.activeElement?.dataset?.productTab || null
    };
  });

  const initial = await readState();
  await page.locator('[data-product-tab="description"]').click();
  const afterDescriptionClick = await readState();
  await page.locator('[data-product-tab="reviews"]').click();
  const afterReviewsClick = await readState();
  await page.locator('[data-product-tab="reviews"]').focus();
  await page.keyboard.press('ArrowRight');
  const afterArrowRight = await readState();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    browser: discovery.browser.name,
    isolatedContext: true,
    viewport: { width: 375, height: 900 },
    url: page.url(),
    submittedForms: false,
    placedOrder: false,
    sentMessages: false,
    initial,
    afterDescriptionClick,
    afterReviewsClick,
    afterArrowRight,
    pageErrors,
    consoleErrors
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
