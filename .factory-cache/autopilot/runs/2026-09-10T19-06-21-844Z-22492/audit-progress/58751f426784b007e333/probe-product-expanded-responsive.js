const fs = require('fs');
const { discoverBrowser, getChromium } = require('../../../../../../scripts/factory/qa/browser');

const output = process.argv[2];
const widths = [1440, 1280, 1024, 768, 390, 375];
const url = 'https://autopilot.local/product/aquatos-5l/#use';

(async () => {
  const found = discoverBrowser();
  if (!found.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({ executablePath: found.browser.executablePath, headless: true });
  const results = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      results.push(await page.evaluate((viewportWidth) => {
        const ids = ['product-breadcrumbs', 'product-overview', 'product-expanded-description', 'product-related', 'product-legal-notices'];
        const rect = (el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, right: r.right };
        };
        const sections = Object.fromEntries(ids.map((id) => {
          const el = document.querySelector(`[data-factory-section="${id}"]`);
          return [id, el ? rect(el) : null];
        }));
        const controls = [];
        ids.forEach((id) => {
          const root = document.querySelector(`[data-factory-section="${id}"]`);
          if (!root) return;
          root.querySelectorAll('button,a,input,select').forEach((el) => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
              controls.push({ section: id, tag: el.tagName.toLowerCase(), type: el.getAttribute('type'), label: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '), disabled: Boolean(el.disabled), x: r.x, y: r.y + scrollY, width: r.width, height: r.height, right: r.right });
            }
          });
        });
        const overflowElements = [...document.querySelectorAll('body *')].map((el) => {
          const r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return null;
          if (r.left >= -1 && r.right <= innerWidth + 1) return null;
          return { tag: el.tagName.toLowerCase(), className: String(el.className || '').slice(0, 180), text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100), left: r.left, right: r.right, width: r.width, y: r.y + scrollY };
        }).filter(Boolean).slice(0, 80);
        return {
          width: viewportWidth,
          url: location.href,
          title: document.title,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          height: document.documentElement.scrollHeight,
          fontsReady: document.fonts ? document.fonts.status : null,
          brokenImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.currentSrc || img.src),
          sections,
          controls,
          overflowElements
        };
      }, width));
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), browser: found.browser.name, url, results }, null, 2));
  console.log(JSON.stringify(results.map(({ width, overflow, height, brokenImages, overflowElements }) => ({ width, overflow, height, brokenImages: brokenImages.length, overflowElements: overflowElements.length }))));
})().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
