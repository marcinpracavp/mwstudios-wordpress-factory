const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser'));

const output = path.join(
  process.cwd(),
  '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/095-audit-round-0-58751f426784b007e333-route-product-archive/interaction-probe-result.json'
);

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported isolated browser executable found');

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));

  await page.goto('https://autopilot.local/kategoria-produktu/fungicydy/', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  const desktop = await page.evaluate(() => {
    const introButton = document.querySelector('.c-product-archive__expand');
    const descriptionButton = document.querySelector('.c-product-archive__description-expand');
    const descriptionCopy = document.querySelector('.c-product-archive__description-copy');
    const quantity = document.querySelector('.c-product-archive__card-actions input[type="number"]');
    const add = document.querySelector('.c-product-archive__add');
    const producer = document.querySelector('.c-product-archive__filter-card--collapsed');
    const sort = document.querySelector('[data-factory-section="archive-sort"]');
    const pagination = document.querySelector('[data-factory-section="archive-pagination"]');
    return {
      title: document.title,
      url: location.href,
      intro: {
        buttonCount: document.querySelectorAll('.c-product-archive__expand').length,
        hidden: introButton ? introButton.hidden : null,
        copyCount: document.querySelectorAll('.c-product-archive__intro-copy').length
      },
      filters: {
        checkboxCount: document.querySelectorAll('.c-product-archive__filters input[type="checkbox"]').length,
        enabledCheckboxCount: document.querySelectorAll('.c-product-archive__filters input[type="checkbox"]:not(:disabled)').length,
        categoryLinkCount: document.querySelectorAll('.c-product-archive__category-list a').length,
        producerInteractiveCount: producer ? producer.querySelectorAll('button,a,input,select').length : 0,
        enabledPriceInputCount: document.querySelectorAll('.c-product-archive__price-filter input:not(:disabled)').length
      },
      sort: {
        selectCount: sort ? sort.querySelectorAll('select').length : 0,
        interactiveCount: sort ? sort.querySelectorAll('select,button,a,input').length : 0
      },
      pagination: {
        linkCount: pagination ? pagination.querySelectorAll('a').length : 0,
        buttonCount: pagination ? pagination.querySelectorAll('button').length : 0,
        labelCount: pagination ? pagination.querySelectorAll('span').length : 0
      },
      cards: {
        count: document.querySelectorAll('.c-product-archive__card').length,
        quantityEnabled: quantity ? !quantity.disabled : null,
        quantityValue: quantity ? quantity.value : null,
        addHref: add ? add.href : null
      },
      description: {
        buttonCount: document.querySelectorAll('.c-product-archive__description-expand').length,
        initialExpanded: descriptionButton ? descriptionButton.getAttribute('aria-expanded') : null,
        initialHeight: descriptionCopy ? descriptionCopy.getBoundingClientRect().height : null
      }
    };
  });

  if (desktop.description.buttonCount === 1) {
    await page.locator('.c-product-archive__description-expand').click();
    await page.waitForTimeout(100);
    desktop.description.afterClick = await page.evaluate(() => {
      const button = document.querySelector('.c-product-archive__description-expand');
      const copy = document.querySelector('.c-product-archive__description-copy');
      return {
        expanded: button ? button.getAttribute('aria-expanded') : null,
        height: copy ? copy.getBoundingClientRect().height : null
      };
    });
  }

  if (desktop.cards.quantityEnabled) {
    const quantity = page.locator('.c-product-archive__card-actions input[type="number"]').first();
    await quantity.fill('2');
    await quantity.dispatchEvent('change');
    desktop.cards.afterQuantityChange = await page.evaluate(() => ({
      value: document.querySelector('.c-product-archive__card-actions input[type="number"]')?.value || null,
      addHref: document.querySelector('.c-product-archive__add')?.href || null
    }));
    await quantity.fill('1');
    await quantity.dispatchEvent('change');
  }

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto('https://autopilot.local/kategoria-produktu/fungicydy/', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  const mobileResult = await mobile.evaluate(() => {
    const filters = document.querySelector('.c-product-archive__filters');
    const rect = filters ? filters.getBoundingClientRect() : null;
    return {
      filtersRect: rect ? { width: rect.width, height: rect.height } : null,
      visibleFilterTriggerCount: Array.from(document.querySelectorAll('button,a')).filter((node) => {
        const label = `${node.textContent || ''} ${node.getAttribute('aria-label') || ''}`;
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return /filtr/i.test(label) && style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
      }).length
    };
  });

  const result = {
    browser: discovery.browser.name,
    isolatedContext: true,
    placedOrder: false,
    submittedPayment: false,
    sentMessage: false,
    submittedBusinessForm: false,
    submittedCartMutation: false,
    pageErrors,
    desktop,
    mobile: mobileResult
  };
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  console.log(JSON.stringify({
    output: path.relative(process.cwd(), output).replace(/\\/g, '/'),
    pageErrors: pageErrors.length,
    filters: desktop.filters,
    sort: desktop.sort,
    pagination: desktop.pagination,
    description: desktop.description,
    cards: desktop.cards,
    mobile: mobileResult
  }));
})().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
