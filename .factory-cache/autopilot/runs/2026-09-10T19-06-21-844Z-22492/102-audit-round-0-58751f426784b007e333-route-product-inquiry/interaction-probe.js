const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser.js'));

const outputDir = path.join(
  process.cwd(),
  '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/102-audit-round-0-58751f426784b007e333-route-product-inquiry'
);
const outputPath = path.join(outputDir, 'interaction-probe.json');

async function dialogState(page) {
  return page.evaluate(() => {
    const product = document.querySelector('.c-product');
    const open = document.querySelector('[data-product-inquiry-open]');
    const dialog = document.querySelector('[data-product-inquiry]');
    const close = document.querySelector('[data-product-inquiry-close]');
    const rect = dialog ? dialog.getBoundingClientRect() : null;
    const style = dialog ? getComputedStyle(dialog) : null;
    return {
      triggerCount: document.querySelectorAll('[data-product-inquiry-open]').length,
      dialogCount: document.querySelectorAll('[data-product-inquiry]').length,
      closeCount: document.querySelectorAll('[data-product-inquiry-close]').length,
      triggerVisible: Boolean(open && open.getClientRects().length),
      dialogClassOpen: Boolean(dialog && dialog.classList.contains('is-open')),
      ariaHidden: dialog ? dialog.getAttribute('aria-hidden') : null,
      productClassOpen: Boolean(product && product.classList.contains('is-inquiry-open')),
      dialogVisible: Boolean(dialog && rect && rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'),
      closeVisible: Boolean(close && close.getClientRects().length),
      dialogRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null
    };
  });
}

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported local browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--disable-gpu', '--disable-background-networking']
  });
  const pageErrors = [];
  const consoleErrors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  try {
    const response = await page.goto('https://autopilot.local/product/aquatos-5l/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForFunction(() => document.fonts ? document.fonts.status === 'loaded' : true, null, { timeout: 10000 });
    const initial = await dialogState(page);
    await page.locator('[data-product-inquiry-open]').click();
    await page.waitForTimeout(100);
    const opened = await dialogState(page);
    await page.screenshot({ path: path.join(outputDir, 'interaction-dialog-open.png'), fullPage: false });
    await page.locator('[data-product-inquiry-close]').click();
    await page.waitForTimeout(100);
    const closed = await dialogState(page);
    await page.screenshot({ path: path.join(outputDir, 'interaction-dialog-closed.png'), fullPage: false });
    const result = {
      generatedAt: new Date().toISOString(),
      browser: discovery.browser.name,
      isolatedContext: true,
      submittedForms: false,
      cartActions: false,
      requestedUrl: 'https://autopilot.local/product/aquatos-5l/',
      finalUrl: page.url(),
      httpStatus: response ? response.status() : null,
      initial,
      opened,
      closed,
      pageErrors,
      consoleErrors,
      passed: response && response.ok()
        && initial.triggerCount === 1
        && initial.dialogCount === 1
        && initial.closeCount === 1
        && initial.ariaHidden === 'true'
        && !initial.dialogClassOpen
        && opened.ariaHidden === 'false'
        && opened.dialogClassOpen
        && opened.productClassOpen
        && opened.dialogVisible
        && opened.closeVisible
        && closed.ariaHidden === 'true'
        && !closed.dialogClassOpen
        && !closed.productClassOpen
        && pageErrors.length === 0
    };
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  fs.writeFileSync(outputPath, `${JSON.stringify({ passed: false, error: error.message }, null, 2)}\n`);
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
