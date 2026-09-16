const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const outputPath = path.resolve(__dirname, 'interaction-live-probe.json');
const routeUrl = 'https://autopilot.local/produkt/pakiet-ochronny-rzepaku-ozimego-12-ha/';

async function probeWidth(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto(routeUrl, { waitUntil: 'networkidle', timeout: 60000 });
  const overview = page.locator('[data-factory-section="product-bundle-overview"]');
  const controlInventory = await overview.locator('button, input, select, a[href]').evaluateAll((elements) => elements.map((element) => ({
    tag: element.tagName.toLowerCase(),
    type: element.getAttribute('type'),
    name: element.getAttribute('name'),
    text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160),
    value: element.value ?? null,
    disabled: Boolean(element.disabled),
    ariaPressed: element.getAttribute('aria-pressed'),
    ariaExpanded: element.getAttribute('aria-expanded'),
    className: String(element.className || '').slice(0, 180)
  })));

  const quantity = overview.locator('input[name="quantity"], input[type="number"]').first();
  let quantityProbe = { found: false };
  if (await quantity.count()) {
    const before = await quantity.inputValue();
    await quantity.focus();
    await page.keyboard.press('ArrowUp');
    const afterUp = await quantity.inputValue();
    await page.keyboard.press('ArrowDown');
    const restored = await quantity.inputValue();
    quantityProbe = { found: true, before, afterUp, restored, changed: before !== afterUp, restoredExactly: before === restored };
  }

  const variationButtons = overview.locator('button').filter({ hasText: /^\s*\d+\s*ha\s*$/i });
  const variationElements = await overview.locator('*').evaluateAll((elements) => elements
    .filter((element) => /^\s*(4|10|12)\s*ha\s*$/i.test(String(element.textContent || '')))
    .filter((element) => ![...element.children].some((child) => /^\s*(4|10|12)\s*ha\s*$/i.test(String(child.textContent || ''))))
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: element.textContent.trim(),
      role: element.getAttribute('role'),
      tabIndex: element.tabIndex,
      ariaPressed: element.getAttribute('aria-pressed'),
      className: String(element.className || ''),
      cursor: getComputedStyle(element).cursor
    })));
  const variationBefore = await variationButtons.evaluateAll((buttons) => buttons.map((button) => ({
    text: button.textContent.trim(),
    ariaPressed: button.getAttribute('aria-pressed'),
    className: button.className
  })));
  let variationProbe = { found: variationBefore.length, before: variationBefore, tested: false };
  if (variationBefore.length >= 2) {
    const target = variationButtons.filter({ hasText: /^\s*4\s*ha\s*$/i }).first();
    const restore = variationButtons.filter({ hasText: /^\s*10\s*ha\s*$/i }).first();
    if (await target.count() && await restore.count()) {
      await target.click();
      await page.waitForTimeout(250);
      const afterTarget = await variationButtons.evaluateAll((buttons) => buttons.map((button) => ({
        text: button.textContent.trim(), ariaPressed: button.getAttribute('aria-pressed'), className: button.className
      })));
      await restore.click();
      await page.waitForTimeout(250);
      const afterRestore = await variationButtons.evaluateAll((buttons) => buttons.map((button) => ({
        text: button.textContent.trim(), ariaPressed: button.getAttribute('aria-pressed'), className: button.className
      })));
      variationProbe = { found: variationBefore.length, before: variationBefore, tested: true, afterTarget, afterRestore };
    }
  }

  const inquiry = overview.locator('button').filter({ hasText: /Chcesz poznać cenę hurtową/i }).first();
  let inquiryProbe = { found: false };
  if (await inquiry.count()) {
    const beforeUrl = page.url();
    await inquiry.click();
    await page.waitForTimeout(300);
    const dialog = page.locator('dialog:visible, [role="dialog"]:visible, [aria-modal="true"]:visible, .modal:visible, .popup:visible, .c-modal:visible');
    inquiryProbe = {
      found: true,
      urlChanged: page.url() !== beforeUrl,
      dialogCount: await dialog.count(),
      bodyClass: await page.locator('body').getAttribute('class'),
      candidates: await page.locator('[class*="inquiry"], [class*="modal"], [class*="popup"], dialog, [role="dialog"]').evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || ''),
          hidden: element.hidden,
          ariaHidden: element.getAttribute('aria-hidden'),
          display: style.display,
          visibility: style.visibility,
          width: rect.width,
          height: rect.height,
          text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180)
        };
      })),
      titleElements: await page.getByText('Zapytaj o produkt', { exact: true }).evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const parent = element.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || ''),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          parent: parent ? {
            tag: parent.tagName.toLowerCase(),
            className: String(parent.className || ''),
            x: parentRect.x,
            y: parentRect.y,
            width: parentRect.width,
            height: parentRect.height,
            role: parent.getAttribute('role'),
            ariaModal: parent.getAttribute('aria-modal')
          } : null
        };
      })),
      formControls: await page.locator('article.c-product form input:visible, article.c-product form textarea:visible, article.c-product form select:visible').evaluateAll((elements) => elements.map((element) => ({
        tag: element.tagName.toLowerCase(), name: element.getAttribute('name'), type: element.getAttribute('type')
      })))
    };
    const screenshotPath = path.resolve(__dirname, `interaction-inquiry-${width}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    inquiryProbe.screenshot = path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    inquiryProbe.dialogCountAfterEscape = await dialog.count();
    inquiryProbe.articleClassAfterEscape = await page.locator('article.c-product').getAttribute('class');
    const closeButton = page.locator('article.c-product button').filter({ hasText: /^\s*[×x]\s*$/i }).first();
    inquiryProbe.closeButtonFound = Boolean(await closeButton.count());
    if (await closeButton.count()) {
      try {
        await closeButton.click({ timeout: 3000 });
        await page.waitForTimeout(150);
        inquiryProbe.closePointerClick = 'passed';
        inquiryProbe.articleClassAfterCloseButton = await page.locator('article.c-product').getAttribute('class');
      } catch (error) {
        inquiryProbe.closePointerClick = 'failed';
        inquiryProbe.closePointerError = String(error.message || error).split('\n').slice(0, 8).join('\n');
        await closeButton.evaluate((button) => button.click());
        await page.waitForTimeout(150);
        inquiryProbe.articleClassAfterProgrammaticCleanup = await page.locator('article.c-product').getAttribute('class');
      }
    }
  }

  const addToCart = overview.locator('button').filter({ hasText: /^\s*Dodaj do koszyka\s*$/i }).first();
  const addToCartProbe = await addToCart.count() ? {
    found: true,
    disabled: await addToCart.isDisabled(),
    text: String(await addToCart.textContent()).trim(),
    clicked: false,
    reason: 'Excluded to avoid changing cart/session state during isolated no-side-effect audit.'
  } : { found: false, clicked: false };

  const result = {
    width,
    httpStatus: response ? response.status() : null,
    controlInventory,
    quantityProbe,
    variationElements,
    variationProbe,
    inquiryProbe,
    addToCartProbe,
    pageErrors
  };
  await context.close();
  return result;
}

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported system browser found');
  const browser = await getChromium().launch({ executablePath: discovery.browser.executablePath, headless: true });
  let results;
  try {
    results = [await probeWidth(browser, 1440), await probeWidth(browser, 390)];
  } finally {
    await browser.close();
  }
  const output = {
    routeUrl,
    browser: discovery.browser.name,
    isolatedContexts: true,
    sideEffects: {
      cartClicked: false,
      orderPlaced: false,
      paymentAttempted: false,
      formSubmitted: false,
      emailSent: false
    },
    results
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(results.map(({ width, httpStatus, quantityProbe, variationProbe, inquiryProbe, addToCartProbe, pageErrors }) => ({
    width, httpStatus, quantityProbe, variationProbe, inquiryProbe, addToCartProbe, pageErrors
  })), null, 2));
})().catch((error) => {
  fs.writeFileSync(outputPath, JSON.stringify({ routeUrl, error: error.stack || error.message }, null, 2) + '\n');
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
