const fs = require('fs');
const { discoverBrowser, getChromium } = require('../../../../../../scripts/factory/qa/browser');

const output = process.argv[2];
const url = 'https://autopilot.local/product/aquatos-5l/#use';

(async () => {
  const found = discoverBrowser();
  if (!found.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({ executablePath: found.browser.executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const snapshot = () => page.evaluate(() => {
    const product = document.querySelector('.c-product');
    const selected = [...document.querySelectorAll('[data-product-tab]')].filter((el) => el.getAttribute('aria-selected') === 'true').map((el) => el.dataset.productTab);
    const activePanels = [...document.querySelectorAll('[data-product-panel].is-active')].map((el) => el.dataset.productPanel);
    const usePanel = document.querySelector('[data-product-panel="use"]');
    const useRect = usePanel?.getBoundingClientRect();
    const useExpanded = usePanel?.querySelector('[data-product-expanded]');
    const useExpandedRect = useExpanded?.getBoundingClientRect();
    const expand = document.querySelector('[data-product-expand]');
    const expandRect = expand?.getBoundingClientRect();
    const tabList = document.querySelector('.c-product__tabs');
    return {
      hash: location.hash,
      selected,
      activePanels,
      useClass: product?.classList.contains('is-use-active') || false,
      useVisible: Boolean(usePanel && useRect && useRect.width > 0 && useRect.height > 0 && getComputedStyle(usePanel).display !== 'none'),
      useExpanded: useExpanded ? { className: useExpanded.className, display: getComputedStyle(useExpanded).display, width: useExpandedRect.width, height: useExpandedRect.height } : null,
      expandVisible: Boolean(expand && expandRect.width > 0 && expandRect.height > 0 && getComputedStyle(expand).visibility !== 'hidden'),
      tabScroller: tabList ? { clientWidth: tabList.clientWidth, scrollWidth: tabList.scrollWidth, scrollLeft: tabList.scrollLeft } : null
    };
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const initialUse = await snapshot();
    await page.click('[data-product-tab="description"]');
    const description = await snapshot();
    await page.click('[data-product-tab="downloads"]');
    const downloads = await snapshot();
    await page.click('[data-product-tab="use"]');
    const returnedUse = await snapshot();
    await page.focus('[data-product-tab="use"]');
    await page.keyboard.press('ArrowRight');
    const afterArrowRight = await snapshot();
    const result = {
      generatedAt: new Date().toISOString(),
      browser: found.browser.name,
      url,
      viewport: { width: 390, height: 900 },
      initialUse,
      description,
      downloads,
      returnedUse,
      afterArrowRight,
      pageErrors
    };
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
