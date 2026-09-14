const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const outputPath = path.join(__dirname, 'cart-interaction-audit.json');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({ executablePath: discovery.browser.executablePath, headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto('https://autopilot.local/produkt/aquatos-5l/', { waitUntil: 'networkidle' });
  const size = page.locator('select[name^="attribute_"]').first();
  if (!(await size.count())) throw new Error('Native variation selector not found');
  await size.selectOption({ label: '5 L' });
  const add = page.locator('.single_add_to_cart_button');
  await add.waitFor({ state: 'visible' });
  await page.locator('.single_add_to_cart_button:not(.disabled)').waitFor({ state: 'visible', timeout: 5000 });
  const enabled = await add.isEnabled();
  const disabledClass = await add.evaluate((node) => node.classList.contains('disabled'));
  if (!enabled || disabledClass) throw new Error('Add-to-cart remains disabled after selecting 5 L');
  await add.click();
  await page.waitForTimeout(500);
  await page.goto('https://autopilot.local/koszyk/', { waitUntil: 'networkidle' });
  const input = page.locator('.woocommerce-cart-form input.qty').first();
  if (!(await input.count())) throw new Error('Cart line quantity input not found');
  const before = Number(await input.inputValue());
  await page.locator('[data-cart-quantity="increase"]').first().click();
  const increased = Number(await input.inputValue());
  await page.locator('[data-cart-quantity="decrease"]').first().click();
  const restored = Number(await input.inputValue());
  const result = {
    browser: discovery.browser.name,
    generatedAt: new Date().toISOString(),
    sessionOnly: true,
    submittedCartUpdate: false,
    placedOrder: false,
    result: { id: 'INT-13', route: 'cart', passed: increased === before + 1 && restored === before, evidence: { before, increased, restored } }
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ outputPath, passed: result.result.passed }));
})().catch((error) => {
  fs.writeFileSync(outputPath, `${JSON.stringify({ fatal: String(error.stack || error) }, null, 2)}\n`);
  console.error(error.stack || error);
  process.exitCode = 1;
});
