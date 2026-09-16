const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');
const { prepare } = require('../../../../../scripts/factory/project/qa-state');

(async () => {
  const outputPath = path.resolve(__dirname, 'cart-interaction-probe.json');
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await prepare({ page, route: { id: 'cart' }, baseUrl: 'https://autopilot.local' });
  await page.waitForLoadState('domcontentloaded');

  const quantity = page.locator('.c-cart__quantity input.qty').first();
  const increase = page.locator('[data-cart-quantity="increase"]').first();
  const decrease = page.locator('[data-cart-quantity="decrease"]').first();
  await quantity.waitFor({ state: 'visible' });
  await increase.waitFor({ state: 'visible' });
  await decrease.waitFor({ state: 'visible' });

  const stateChangingRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') {
      stateChangingRequests.push({ method: request.method(), url: request.url() });
    }
  });

  const before = Number(await quantity.inputValue());
  await increase.click();
  const increased = Number(await quantity.inputValue());
  await decrease.click();
  const restored = Number(await quantity.inputValue());
  await page.waitForTimeout(150);

  const couponVisible = await page.getByText('Dodano kod BLACKFRIDAY', { exact: false }).count() > 0;
  const checkout = page.getByRole('link', { name: 'Realizuj zamówienie' }).first();
  const continueShopping = page.getByRole('link', { name: 'Kontynuuj zakupy' }).first();
  const result = {
    generatedAt: new Date().toISOString(),
    browser: discovery.browser.name,
    isolatedContext: true,
    route: page.url(),
    lineCount: await page.locator('.c-cart__line').count(),
    quantity: {
      before,
      increased,
      restored,
      increaseVisible: await increase.isVisible(),
      decreaseVisible: await decrease.isVisible()
    },
    couponVisible,
    checkout: {
      visible: await checkout.isVisible(),
      href: await checkout.getAttribute('href')
    },
    continueShopping: {
      visible: await continueShopping.isVisible(),
      href: await continueShopping.getAttribute('href')
    },
    stateChangingRequestsAfterSetup: stateChangingRequests,
    orderPlaced: false,
    paymentAttempted: false,
    checkoutVisited: false,
    consoleErrors,
    pageErrors
  };

  await context.close();
  await browser.close();
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
