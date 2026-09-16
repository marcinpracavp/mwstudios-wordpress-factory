const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser'));

const outputPath = path.join(
  process.cwd(),
  '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/092-audit-round-0-58751f426784b007e333-route-product/interaction-audit.json'
);
const url = 'https://autopilot.local/produkt/aquatos-5l/';

async function readTabState(page, key) {
  return page.evaluate((requestedKey) => {
    const product = document.querySelector('.c-product');
    const tab = product?.querySelector(`[data-product-tab="${requestedKey}"]`);
    const panel = product?.querySelector(`[data-product-panel="${requestedKey}"]`);
    return {
      requestedKey,
      tabExists: Boolean(tab),
      selected: tab?.getAttribute('aria-selected') ?? null,
      panelExists: Boolean(panel),
      panelActive: panel?.classList.contains('is-active') ?? false,
      panelVisible: panel ? getComputedStyle(panel).display !== 'none' : false,
      activePanelKeys: [...(product?.querySelectorAll('[data-product-panel].is-active') || [])].map((node) => node.dataset.productPanel),
      hash: location.hash,
      sectionIdentity: product?.querySelector('.c-product__tabs-content')?.getAttribute('data-factory-section') ?? null,
    };
  }, key);
}

async function activateTab(page, key) {
  const tab = page.locator(`[data-product-tab="${key}"]`);
  if (await tab.count() === 0) return readTabState(page, key);
  await tab.click();
  return readTabState(page, key);
}

(async () => {
  const discovered = discoverBrowser();
  const browser = await getChromium().launch({
    executablePath: discovered.browser.executablePath,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const postRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    if (request.method() === 'POST') postRequests.push({ url: request.url(), resourceType: request.resourceType() });
  });

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const initial = await page.evaluate(() => ({
      title: document.title,
      productCount: document.querySelectorAll('.c-product').length,
      tabCount: document.querySelectorAll('[data-product-tab]').length,
      activePanelKeys: [...document.querySelectorAll('[data-product-panel].is-active')].map((node) => node.dataset.productPanel),
      selectedTabKeys: [...document.querySelectorAll('[data-product-tab][aria-selected="true"]')].map((node) => node.dataset.productTab),
      variationSelectCount: document.querySelectorAll('form.variations_form select').length,
    }));

    const reviews = await activateTab(page, 'reviews');
    const downloads = await activateTab(page, 'downloads');
    const description = await activateTab(page, 'description');

    const expandBefore = await page.evaluate(() => ({
      triggerExists: Boolean(document.querySelector('[data-product-expand]')),
      triggerHidden: document.querySelector('[data-product-expand]')?.hidden ?? null,
      expandedExists: Boolean(document.querySelector('[data-product-expanded]')),
      expandedOpen: document.querySelector('[data-product-expanded]')?.classList.contains('is-open') ?? false,
    }));
    if (expandBefore.triggerExists) await page.locator('[data-product-expand]').click();
    const expandAfter = await page.evaluate(() => ({
      triggerHidden: document.querySelector('[data-product-expand]')?.hidden ?? null,
      expandedOpen: document.querySelector('[data-product-expanded]')?.classList.contains('is-open') ?? false,
      expandedVisible: (() => {
        const node = document.querySelector('[data-product-expanded]');
        return node ? getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().height > 0 : false;
      })(),
    }));

    const inquiryBefore = await page.evaluate(() => ({
      triggerExists: Boolean(document.querySelector('[data-product-inquiry-open]')),
      dialogExists: Boolean(document.querySelector('[data-product-inquiry]')),
      open: document.querySelector('[data-product-inquiry]')?.classList.contains('is-open') ?? false,
      ariaHidden: document.querySelector('[data-product-inquiry]')?.getAttribute('aria-hidden') ?? null,
    }));
    if (inquiryBefore.triggerExists) await page.locator('[data-product-inquiry-open]').click();
    const inquiryOpen = await page.evaluate(() => ({
      open: document.querySelector('[data-product-inquiry]')?.classList.contains('is-open') ?? false,
      visible: (() => {
        const node = document.querySelector('[data-product-inquiry]');
        return node ? getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().height > 0 : false;
      })(),
      ariaHidden: document.querySelector('[data-product-inquiry]')?.getAttribute('aria-hidden') ?? null,
      productOpenClass: document.querySelector('.c-product')?.classList.contains('is-inquiry-open') ?? false,
      summarySection: document.querySelector('.c-product__summary')?.getAttribute('data-factory-section') ?? null,
      activeElement: document.activeElement?.getAttribute('data-product-inquiry-open') !== null ? 'open-trigger' : document.activeElement?.tagName,
    }));
    if (inquiryBefore.dialogExists) await page.locator('[data-product-inquiry-close]').click();
    const inquiryClosed = await page.evaluate(() => ({
      open: document.querySelector('[data-product-inquiry]')?.classList.contains('is-open') ?? false,
      visible: (() => {
        const node = document.querySelector('[data-product-inquiry]');
        return node ? getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().height > 0 : false;
      })(),
      ariaHidden: document.querySelector('[data-product-inquiry]')?.getAttribute('aria-hidden') ?? null,
      productOpenClass: document.querySelector('.c-product')?.classList.contains('is-inquiry-open') ?? false,
      summarySection: document.querySelector('.c-product__summary')?.getAttribute('data-factory-section') ?? null,
    }));

    const variation = await page.evaluate(async () => {
      const form = document.querySelector('form.variations_form');
      const select = form?.querySelector('select');
      if (!form || !select) return { formExists: Boolean(form), selectExists: Boolean(select), tested: false };
      const option = [...select.options].find((item) => item.value && !item.disabled);
      if (!option) return { formExists: true, selectExists: true, tested: false, reason: 'no enabled non-empty option' };
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 700));
      return {
        formExists: true,
        selectExists: true,
        tested: true,
        selectedValue: select.value,
        selectedLabel: option.textContent.trim(),
        variationId: form.querySelector('input.variation_id')?.value ?? null,
        addToCartDisabled: form.querySelector('.single_add_to_cart_button')?.classList.contains('disabled') ?? null,
        variationPriceVisible: (() => {
          const node = form.querySelector('.woocommerce-variation-price');
          return node ? getComputedStyle(node).display !== 'none' && node.textContent.trim().length > 0 : null;
        })(),
      };
    });

    await page.goto(`${url}#reviews`, { waitUntil: 'networkidle', timeout: 45000 });
    const directHashReviews = await readTabState(page, 'reviews');

    const keyboard = await page.evaluate(async () => {
      const first = document.querySelector('[data-product-tab]');
      if (!first) return { tested: false };
      first.focus();
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        tested: true,
        focusedKey: document.activeElement?.dataset?.productTab ?? null,
        selectedKey: document.querySelector('[data-product-tab][aria-selected="true"]')?.dataset?.productTab ?? null,
      };
    });

    const result = {
      browser: discovered.browser.name,
      generatedAt: new Date().toISOString(),
      isolatedContext: true,
      route: 'product',
      url,
      httpStatus: response?.status() ?? null,
      finalUrl: page.url(),
      businessSideEffects: {
        submittedForms: false,
        addedToCart: false,
        placedOrder: false,
        sentInquiry: false,
        observedPostRequests: postRequests,
      },
      checks: {
        initial,
        reviews,
        downloads,
        description,
        expand: { before: expandBefore, after: expandAfter },
        inquiry: { before: inquiryBefore, open: inquiryOpen, closed: inquiryClosed },
        variation,
        directHashReviews,
        keyboard,
      },
      runtime: { pageErrors, consoleErrors },
    };
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify({ outputPath: path.relative(process.cwd(), outputPath), httpStatus: result.httpStatus, checks: result.checks, runtime: result.runtime, businessSideEffects: result.businessSideEffects }, null, 2)}\n`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
