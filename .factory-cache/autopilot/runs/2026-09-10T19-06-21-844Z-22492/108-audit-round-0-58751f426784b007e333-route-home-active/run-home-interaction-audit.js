const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const outputPath = path.join(__dirname, 'home-interaction-probe.json');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));
  await page.goto('https://autopilot.local/', { waitUntil: 'networkidle' });

  const initial = await page.evaluate(() => {
    const knowledge = [...document.querySelectorAll('[data-factory-section="home-knowledge"] details')];
    const cropLinks = [...document.querySelectorAll('[data-factory-section="home-crop-selection"] .c-home-crop')];
    const productSections = [...document.querySelectorAll('.c-home-products[data-factory-section]')];
    const quantities = [...document.querySelectorAll('.c-home-card__quantity')];
    return {
      url: location.href,
      cropCount: cropLinks.length,
      cropTags: [...new Set(cropLinks.map((node) => node.tagName))],
      cropPressedCount: cropLinks.filter((node) => node.getAttribute('aria-pressed') === 'true').length,
      cropPopupCount: document.querySelectorAll('[data-factory-section="home-crop-selection"] [role="menu"], [data-factory-section="home-crop-selection"] [role="dialog"], [data-factory-section="home-crop-selection"] .c-home-crop-popover').length,
      quantityCount: quantities.length,
      quantityButtonCount: quantities.reduce((count, node) => count + node.querySelectorAll('button, input').length, 0),
      productSectionCount: productSections.length,
      carouselControlCount: productSections.reduce((count, node) => count + node.querySelectorAll('button, .swiper-button-prev, .swiper-button-next, .swiper-pagination').length, 0),
      productGridOverflow: productSections.map((section) => {
        const grid = section.querySelector('.c-home-product-grid');
        return grid ? { section: section.dataset.factorySection, clientWidth: grid.clientWidth, scrollWidth: grid.scrollWidth } : null;
      }),
      knowledgeCount: knowledge.length,
      knowledgeOpen: knowledge.map((node) => node.open),
      knowledgeIcons: knowledge.map((node) => node.querySelector('summary img')?.getAttribute('src') || null)
    };
  });

  const cropProbe = await page.locator('[data-factory-section="home-crop-selection"] .c-home-crop').first().evaluate((node) => {
    node.addEventListener('click', (event) => event.preventDefault(), { once: true });
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const section = node.closest('[data-factory-section="home-crop-selection"]');
    return {
      url: location.href,
      pressed: node.getAttribute('aria-pressed'),
      activeClass: node.classList.contains('is-active') || node.classList.contains('active'),
      popupCount: section.querySelectorAll('[role="menu"], [role="dialog"], .c-home-crop-popover').length
    };
  });

  const details = page.locator('[data-factory-section="home-knowledge"] details');
  if (await details.count() > 1) await details.nth(1).locator('summary').click();
  const afterSecondKnowledge = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-factory-section="home-knowledge"] details')];
    return {
      open: nodes.map((node) => node.open),
      icons: nodes.map((node) => node.querySelector('summary img')?.getAttribute('src') || null)
    };
  });
  if (await details.count() > 0) await details.nth(0).locator('summary').click();
  const afterFirstKnowledge = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-factory-section="home-knowledge"] details')];
    return {
      open: nodes.map((node) => node.open),
      icons: nodes.map((node) => node.querySelector('summary img')?.getAttribute('src') || null)
    };
  });

  const result = {
    browser: discovery.browser.name,
    generatedAt: new Date().toISOString(),
    isolatedContext: true,
    businessSideEffects: false,
    initial,
    cropProbe,
    afterSecondKnowledge,
    afterFirstKnowledge,
    pageErrors
  };
  await context.close();
  await browser.close();
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, pageErrors: pageErrors.length, cropCount: initial.cropCount, quantityButtonCount: initial.quantityButtonCount, carouselControlCount: initial.carouselControlCount, knowledgeOpenAfterSecond: afterSecondKnowledge.open }));
})().catch((error) => {
  fs.writeFileSync(outputPath, `${JSON.stringify({ fatal: String(error.stack || error) }, null, 2)}\n`);
  console.error(error.stack || error);
  process.exitCode = 1;
});
