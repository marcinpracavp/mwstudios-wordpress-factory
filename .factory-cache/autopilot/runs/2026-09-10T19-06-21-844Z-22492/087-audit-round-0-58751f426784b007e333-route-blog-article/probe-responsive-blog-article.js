const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const widths = [1440, 1280, 1024, 768, 390, 375];
const url = 'https://autopilot.local/blog/popularne-nawozy-potasowe-i-ich-zastosowanie-w-uprawach/';

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--disable-gpu', '--disable-background-networking']
  });
  const results = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate((viewportWidth) => {
        const sectionIds = ['blog-article-heading', 'blog-article-content', 'blog-related-posts'];
        const sections = sectionIds.map((id) => {
          const element = document.querySelector(`[data-factory-section="${id}"]`);
          if (!element) return { id, present: false };
          const rect = element.getBoundingClientRect();
          const controls = [...element.querySelectorAll('a,button,input,select,textarea')].map((control) => {
            const controlRect = control.getBoundingClientRect();
            const style = getComputedStyle(control);
            return {
              tag: control.tagName.toLowerCase(),
              text: (control.textContent || control.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 100),
              href: control instanceof HTMLAnchorElement ? control.href : null,
              disabled: Boolean(control.disabled),
              visible: style.display !== 'none' && style.visibility !== 'hidden' && controlRect.width > 0 && controlRect.height > 0,
              rect: { x: controlRect.x, y: controlRect.y, width: controlRect.width, height: controlRect.height },
              outsideViewportX: controlRect.left < -1 || controlRect.right > viewportWidth + 1
            };
          });
          const offenders = [...element.querySelectorAll('*')].map((child) => {
            const childRect = child.getBoundingClientRect();
            return { tag: child.tagName.toLowerCase(), className: String(child.className || '').slice(0, 120), left: childRect.left, right: childRect.right, width: childRect.width };
          }).filter((child) => child.left < -1 || child.right > viewportWidth + 1).slice(0, 20);
          return {
            id,
            present: true,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            overflowPx: Math.max(0, element.scrollWidth - element.clientWidth),
            controls,
            horizontalOffenders: offenders
          };
        });
        return {
          viewportWidth,
          finalUrl: location.href,
          title: document.title,
          documentWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          fontsReady: document.fonts.status === 'loaded',
          sections
        };
      }, width);
      results.push(result);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  const report = { browser: discovery.browser.name, url, widths: results };
  const outputPath = path.join(__dirname, 'responsive-probe.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({
    output: outputPath,
    widths: results.map((item) => ({
      viewportWidth: item.viewportWidth,
      finalUrl: item.finalUrl,
      overflowPx: item.overflowPx,
      missingSections: item.sections.filter((section) => !section.present).map((section) => section.id),
      sectionOverflow: item.sections.map((section) => ({ id: section.id, overflowPx: section.overflowPx || 0, offenders: (section.horizontalOffenders || []).length })),
      invalidControls: item.sections.flatMap((section) => section.controls || []).filter((control) => !control.visible || control.disabled || control.outsideViewportX).length
    }))
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
