const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.resolve('scripts/factory/qa/browser.js'));

const outputPath = path.resolve('.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/audit-progress/58751f426784b007e333/route-product-interactions-probe.json');
const screenshotPath = path.resolve('.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/audit-progress/58751f426784b007e333/route-product-interactions-probe.png');
const url = 'https://autopilot.local/product/aquatos-5l/';

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported local browser found');

  const result = {
    browser: discovery.browser.name,
    url,
    isolatedContext: true,
    safeGuards: {
      blockedNonReadRequests: true,
      clickedAddToCart: false,
      submittedForms: false,
      placedOrder: false,
      sentEmail: false
    },
    blockedMutationRequests: [],
    consoleErrors: [],
    pageErrors: [],
    tests: {}
  };

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => result.pageErrors.push(error.message));
  await page.route('**/*', async (route) => {
    const method = route.request().method().toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      result.blockedMutationRequests.push({ method, url: route.request().url() });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  result.title = await page.title();

  const tabs = page.locator('[data-product-tab]');
  const tabCount = await tabs.count();
  result.tests.tabs = [];
  for (let index = 0; index < tabCount; index += 1) {
    const tab = tabs.nth(index);
    const key = await tab.getAttribute('data-product-tab');
    const label = (await tab.innerText()).trim();
    await tab.click();
    await page.waitForTimeout(80);
    const state = await page.evaluate((activeKey) => ({
      selectedCount: document.querySelectorAll('[data-product-tab][aria-selected="true"]').length,
      selected: document.querySelector(`[data-product-tab="${activeKey}"]`)?.getAttribute('aria-selected'),
      activePanels: [...document.querySelectorAll('[data-product-panel].is-active')].map((panel) => panel.dataset.productPanel),
      hash: window.location.hash
    }), key);
    result.tests.tabs.push({ key, label, ...state });
  }

  const descriptionTab = page.locator('[data-product-tab="description"]');
  if (await descriptionTab.count()) await descriptionTab.click();
  const expand = page.locator('[data-product-expand]');
  result.tests.descriptionExpand = { present: (await expand.count()) > 0 };
  if (await expand.count()) {
    result.tests.descriptionExpand.before = await page.locator('[data-product-expanded]').getAttribute('class');
    await expand.click();
    result.tests.descriptionExpand.after = await page.locator('[data-product-expanded]').getAttribute('class');
    result.tests.descriptionExpand.triggerHidden = await expand.evaluate((element) => element.hidden);
  }

  const inquiryOpen = page.locator('[data-product-inquiry-open]');
  const inquiryClose = page.locator('[data-product-inquiry-close]');
  result.tests.inquiry = { openControlPresent: (await inquiryOpen.count()) > 0 };
  if (await inquiryOpen.count()) {
    await inquiryOpen.click();
    result.tests.inquiry.open = await page.locator('[data-product-inquiry]').evaluate((element) => ({
      classOpen: element.classList.contains('is-open'),
      ariaHidden: element.getAttribute('aria-hidden')
    }));
    if (await inquiryClose.count()) await inquiryClose.click();
    result.tests.inquiry.closed = await page.locator('[data-product-inquiry]').evaluate((element) => ({
      classOpen: element.classList.contains('is-open'),
      ariaHidden: element.getAttribute('aria-hidden')
    }));
  }

  const variationSelects = page.locator('form.variations_form select');
  const variationSelectCount = await variationSelects.count();
  result.tests.variations = { selectCount: variationSelectCount, selects: [] };
  for (let index = 0; index < variationSelectCount; index += 1) {
    const select = variationSelects.nth(index);
    const details = await select.evaluate((element) => ({
      name: element.name,
      options: [...element.options].map((option) => ({ value: option.value, label: option.textContent.trim(), disabled: option.disabled }))
    }));
    const selectable = details.options.filter((option) => option.value && !option.disabled);
    if (selectable.length) await select.selectOption(selectable[0].value);
    details.selectedValue = await select.inputValue();
    result.tests.variations.selects.push(details);
  }
  await page.waitForTimeout(300);
  const cartButton = page.locator('form.variations_form button.single_add_to_cart_button');
  result.tests.variations.cartButton = (await cartButton.count()) ? await cartButton.evaluate((element) => ({
    disabled: element.disabled,
    className: element.className,
    text: element.textContent.trim()
  })) : null;
  result.tests.variations.variationId = await page.locator('form.variations_form input.variation_id').count()
    ? await page.locator('form.variations_form input.variation_id').inputValue()
    : null;
  result.tests.variations.optionStates = [];
  if (variationSelectCount === 1) {
    const select = variationSelects.first();
    const options = await select.evaluate((element) => [...element.options]
      .filter((option) => option.value && !option.disabled)
      .map((option) => ({ value: option.value, label: option.textContent.trim() })));
    for (const option of options) {
      await select.selectOption(option.value);
      await page.waitForTimeout(250);
      result.tests.variations.optionStates.push({
        ...option,
        variationId: await page.locator('form.variations_form input.variation_id').inputValue(),
        cartDisabled: await cartButton.evaluate((element) => element.disabled),
        variationPrice: await page.locator('.woocommerce-variation-price').count()
          ? (await page.locator('.woocommerce-variation-price').innerText()).trim()
          : ''
      });
    }
    if (options.some((option) => option.value === '5 L')) {
      await select.selectOption('5 L');
      await page.waitForTimeout(250);
    }
  }

  const quantityInput = page.locator('form.variations_form input.qty');
  const quantityButtons = page.locator('form.variations_form .quantity button, form.variations_form [data-quantity], form.variations_form .minus, form.variations_form .plus');
  result.tests.quantity = {
    inputPresent: (await quantityInput.count()) > 0,
    inputValue: (await quantityInput.count()) ? await quantityInput.inputValue() : null,
    stepButtonCount: await quantityButtons.count()
  };

  await page.screenshot({ path: screenshotPath, fullPage: true });
  result.tests.tabsPassed = result.tests.tabs.length === 5 && result.tests.tabs.every((entry) =>
    entry.selectedCount === 1 && entry.selected === 'true' && entry.activePanels.length === 1 && entry.activePanels[0] === entry.key && entry.hash === `#${entry.key}`
  );
  result.tests.descriptionExpandPassed = result.tests.descriptionExpand.present
    && /is-open/.test(result.tests.descriptionExpand.after || '')
    && result.tests.descriptionExpand.triggerHidden === true;
  result.tests.inquiryPassed = result.tests.inquiry.open?.classOpen === true
    && result.tests.inquiry.open?.ariaHidden === 'false'
    && result.tests.inquiry.closed?.classOpen === false
    && result.tests.inquiry.closed?.ariaHidden === 'true';
  result.tests.variationsPassed = variationSelectCount > 0
    && result.tests.variations.selects.every((entry) => Boolean(entry.selectedValue))
    && Boolean(result.tests.variations.variationId)
    && result.tests.variations.cartButton?.disabled === false
    && result.tests.variations.optionStates.length === 3
    && result.tests.variations.optionStates.every((entry) => Boolean(entry.variationId) && entry.cartDisabled === false);

  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  await context.close();
  await browser.close();
  console.log(JSON.stringify({
    output: path.relative(process.cwd(), outputPath),
    screenshot: path.relative(process.cwd(), screenshotPath),
    tabsPassed: result.tests.tabsPassed,
    descriptionExpandPassed: result.tests.descriptionExpandPassed,
    inquiryPassed: result.tests.inquiryPassed,
    variationsPassed: result.tests.variationsPassed,
    blockedMutationRequests: result.blockedMutationRequests.length,
    consoleErrors: result.consoleErrors.length,
    pageErrors: result.pageErrors.length,
    quantityStepButtons: result.tests.quantity.stepButtonCount
  }));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
