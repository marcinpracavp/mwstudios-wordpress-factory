const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser.js'));

const outputDir = path.join(
  process.cwd(),
  '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/103-audit-round-0-58751f426784b007e333-route-order-confirmed'
);
const outputPath = path.join(outputDir, 'interaction-live-probe.json');
const screenshotPath = path.join(outputDir, 'interaction-live-probe.png');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) {
    throw new Error('No supported system browser was found for the isolated interaction probe.');
  }

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const requestedUrl = 'https://autopilot.local/zamowienie/order-received/';
  const response = await page.goto(requestedUrl, { waitUntil: 'networkidle', timeout: 30000 });
  const initialCookies = await context.cookies();
  const observations = await page.evaluate(() => {
    const routeSectionIds = [
      'confirmation-heading',
      'checkout-steps',
      'checkout-order-confirmation',
      'confirmation-line-items',
      'checkout-totals'
    ];
    const main = document.querySelector('main');
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const controls = main
      ? [...main.querySelectorAll('button, input, select, textarea, a')].map((element) => ({
          tag: element.tagName.toLowerCase(),
          type: element.getAttribute('type'),
          text: (element.textContent || element.getAttribute('value') || element.getAttribute('placeholder') || '').trim().slice(0, 120),
          href: element.getAttribute('href'),
          disabled: Boolean(element.disabled),
          visible: isVisible(element)
        }))
      : [];
    const forms = main
      ? [...main.querySelectorAll('form')].map((form) => ({
          action: form.getAttribute('action'),
          method: form.getAttribute('method'),
          visible: isVisible(form)
        }))
      : [];
    const url = new URL(window.location.href);
    return {
      finalUrl: window.location.href,
      title: document.title,
      pathname: url.pathname,
      search: url.search,
      hasOrderIdInPath: /order-received\/\d+\/?$/.test(url.pathname),
      hasOrderKey: url.searchParams.has('key'),
      routeSections: routeSectionIds.map((id) => ({
        id,
        count: document.querySelectorAll(`[data-factory-section="${id}"]`).length
      })),
      hasMain: Boolean(main),
      mainTextSample: main ? main.innerText.trim().slice(0, 300) : '',
      thankYouNoticeCount: document.querySelectorAll('.woocommerce-thankyou-order-received').length,
      orderOverviewCount: document.querySelectorAll('.woocommerce-order-overview').length,
      orderDetailsCount: document.querySelectorAll('.woocommerce-order-details').length,
      controls,
      forms,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
    };
  });

  await page.screenshot({ path: screenshotPath, fullPage: true });
  const result = {
    generatedAt: new Date().toISOString(),
    browser: discovery.browser.name,
    isolatedContext: true,
    requestedUrl,
    responseStatus: response ? response.status() : null,
    observations,
    pageErrors,
    consoleErrors,
    cookiesAfterNavigation: initialCookies.map((cookie) => cookie.name),
    actionsPerformed: ['read-only navigation', 'DOM inspection', 'screenshot'],
    businessSideEffects: false
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  process.stdout.write(`WROTE ${path.relative(process.cwd(), outputPath)}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
