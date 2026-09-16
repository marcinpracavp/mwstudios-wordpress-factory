const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.resolve('scripts/factory/qa/browser.js'));

const outputPath = path.resolve('.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/audit-progress/58751f426784b007e333/route-product-files-state-interaction-probe.json');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser discovered');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('https://autopilot.local/product/aquatos-5l/#downloads', { waitUntil: 'networkidle' });

  const snapshot = async () => page.evaluate(() => ({
    url: location.href,
    hash: location.hash,
    tabs: [...document.querySelectorAll('[data-product-tab]')].map((node) => ({
      key: node.getAttribute('data-product-tab'),
      text: node.textContent.trim(),
      selected: node.getAttribute('aria-selected'),
      disabled: node.disabled,
    })),
    activePanels: [...document.querySelectorAll('[data-product-panel].is-active')].map((node) => node.getAttribute('data-product-panel')),
    downloads: {
      label: document.querySelector('[data-product-panel="downloads"]')?.textContent.trim() || '',
      linkCount: document.querySelectorAll('[data-product-panel="downloads"] a[href]').length,
      iconCount: document.querySelectorAll('[data-product-panel="downloads"] img').length,
    },
    commerce: {
      variationFormCount: document.querySelectorAll('form.variations_form').length,
      variationSelectCount: document.querySelectorAll('form.variations_form select').length,
      quantityInputCount: document.querySelectorAll('.c-product__summary-main input.qty, .c-product__summary-main input[name="quantity"]').length,
      enabledCartButtonCount: [...document.querySelectorAll('.c-product__summary-main button[type="submit"]')].filter((node) => !node.disabled).length,
      favoriteControlCount: document.querySelectorAll('.c-product__summary-main button[aria-label*="ulub" i], .c-product__summary-main a[aria-label*="ulub" i], .c-product__summary button[data-product-favorite]').length,
    },
    inquiry: {
      openerCount: document.querySelectorAll('[data-product-inquiry-open]').length,
      dialogCount: document.querySelectorAll('[data-product-inquiry]').length,
      open: document.querySelector('[data-product-inquiry]')?.classList.contains('is-open') || false,
      ariaHidden: document.querySelector('[data-product-inquiry]')?.getAttribute('aria-hidden') || null,
    },
  }));

  const initial = await snapshot();
  await page.locator('[data-product-tab="technical"]').click();
  const afterTechnicalClick = await snapshot();
  await page.locator('[data-product-tab="downloads"]').focus();
  await page.keyboard.press('Enter');
  const afterDownloadsKeyboard = await snapshot();
  await page.locator('[data-product-inquiry-open]').click();
  const inquiryOpen = await snapshot();
  await page.locator('[data-product-inquiry-close]').click();
  const inquiryClosed = await snapshot();

  const result = {
    browser: discovery.browser.name,
    isolatedContext: true,
    businessSideEffects: {
      submittedForms: false,
      clickedAddToCart: false,
      placedOrder: false,
      sentEmail: false,
    },
    initial,
    afterTechnicalClick,
    afterDownloadsKeyboard,
    inquiryOpen,
    inquiryClosed,
    pageErrors,
    consoleErrors,
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, result }, null, 2)}\n`);
  await context.close();
  await browser.close();
})().catch((error) => {
  fs.writeFileSync(outputPath, `${JSON.stringify({ error: error.stack || error.message }, null, 2)}\n`);
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
