const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const outputPath = path.resolve(__dirname, 'responsive-live-probe.json');
const routeUrl = 'https://autopilot.local/produkt/pakiet-ochronny-rzepaku-ozimego-12-ha/';
const widths = [1440, 1280, 1024, 768, 390, 375];

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported system browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const results = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        ignoreHTTPSErrors: true
      });
      const page = await context.newPage();
      const response = await page.goto(routeUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      const probe = await page.evaluate(() => {
        const visible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const describe = (element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: String(element.className || '').slice(0, 180),
            text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            fullyInViewportX: rect.left >= -0.5 && rect.right <= innerWidth + 0.5
          };
        };
        const section = (id) => document.querySelector(`[data-factory-section="${id}"]`);
        const related = section('product-related');
        const overview = section('product-bundle-overview');
        const tabs = section('bundle-tabs');
        const tabControls = tabs ? [...tabs.querySelectorAll('button, a, [role="tab"]')].filter(visible).map(describe) : [];
        const relatedCards = related ? [...related.querySelectorAll('li.product, article, .product-card, [data-product-id]')].filter(visible).map(describe) : [];
        const quantityControls = overview ? [...overview.querySelectorAll('input.qty, button, [role="button"]')].filter(visible).map(describe) : [];
        const overflowElements = [...document.querySelectorAll('body *')]
          .filter(visible)
          .map(describe)
          .filter((item) => item.x < -1 || item.right > innerWidth + 1)
          .slice(0, 20);
        return {
          title: document.title,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
          targetSectionsPresent: ['bundle-breadcrumbs', 'product-bundle-overview', 'bundle-benefits', 'bundle-tabs', 'product-related', 'product-legal-notices'].reduce((acc, id) => {
            acc[id] = Boolean(section(id));
            return acc;
          }, {}),
          tabControls,
          relatedCards,
          quantityControls,
          overflowElements
        };
      });
      results.push({ width, status: response ? response.status() : null, ...probe });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(outputPath, JSON.stringify({ routeUrl, browser: discovery.browser.name, results }, null, 2) + '\n');
  console.log(JSON.stringify(results.map(({ width, status, horizontalOverflow, tabControls, relatedCards, quantityControls, overflowElements }) => ({
    width,
    status,
    horizontalOverflow,
    tabControls: tabControls.map(({ text, fullyInViewportX, x, right }) => ({ text, fullyInViewportX, x, right })),
    relatedCardCount: relatedCards.length,
    quantityControls: quantityControls.map(({ text, tag, fullyInViewportX }) => ({ text, tag, fullyInViewportX })),
    overflowElementCount: overflowElements.length
  })), null, 2));
})().catch((error) => {
  fs.writeFileSync(outputPath, JSON.stringify({ routeUrl, error: error.stack || error.message }, null, 2) + '\n');
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
