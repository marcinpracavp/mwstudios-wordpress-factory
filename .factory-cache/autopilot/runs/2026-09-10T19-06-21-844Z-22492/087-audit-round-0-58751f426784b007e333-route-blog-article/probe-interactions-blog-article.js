const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const startUrl = 'https://autopilot.local/blog/popularne-nawozy-potasowe-i-ich-zastosowanie-w-uprawach/';
const sectionSelector = [
  '[data-factory-section="blog-article-heading"]',
  '[data-factory-section="blog-article-content"]',
  '[data-factory-section="blog-related-posts"]'
].join(',');
const controlSelector = `:is(${sectionSelector}) a, :is(${sectionSelector}) button`;

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--disable-gpu', '--disable-background-networking']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const report = { browser: discovery.browser.name, startUrl, controls: [], clicks: [], skippedExternal: [] };
  try {
    await page.goto(startUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    report.resolvedStartUrl = page.url();
    report.controls = await page.locator(controlSelector).evaluateAll((controls) => controls.map((control, index) => {
      const rect = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      return {
        index,
        tag: control.tagName.toLowerCase(),
        text: (control.textContent || control.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 140),
        href: control instanceof HTMLAnchorElement ? control.href : null,
        target: control.getAttribute('target'),
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        disabled: Boolean(control.disabled),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    }));

    const localCandidates = report.controls.filter((control) => {
      if (!control.href || !control.visible || control.disabled) return false;
      const candidate = new URL(control.href);
      const base = new URL(report.resolvedStartUrl);
      return candidate.origin === base.origin
        && !/(cart|koszyk|checkout|zamow|order|account|konto|logout|wylog)/i.test(candidate.pathname + candidate.search);
    });
    report.skippedExternal = report.controls.filter((control) => control.href && !localCandidates.some((candidate) => candidate.index === control.index)).map((control) => ({
      index: control.index,
      text: control.text,
      href: control.href,
      reason: new URL(control.href).origin !== new URL(report.resolvedStartUrl).origin
        ? 'external destination inspected without navigation'
        : 'not a safe local GET navigation candidate'
    }));

    for (const candidate of localCandidates) {
      const testPage = await context.newPage();
      await testPage.goto(report.resolvedStartUrl, { waitUntil: 'networkidle', timeout: 60000 });
      const locator = testPage.locator(controlSelector).nth(candidate.index);
      let popup = null;
      testPage.once('popup', (newPage) => { popup = newPage; });
      let clickError = null;
      try {
        await locator.scrollIntoViewIfNeeded();
        await locator.click({ timeout: 10000 });
        await testPage.waitForTimeout(500);
        if (popup) await popup.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      } catch (error) {
        clickError = error.message;
      }
      const destinationPage = popup || testPage;
      report.clicks.push({
        index: candidate.index,
        text: candidate.text,
        expectedHref: candidate.href,
        finalUrl: destinationPage.url(),
        title: await destinationPage.title().catch(() => ''),
        error: clickError,
        navigatedToExpected: destinationPage.url().replace(/\/$/, '') === candidate.href.replace(/\/$/, '')
      });
      if (popup) await popup.close();
      await testPage.close();
    }
  } finally {
    await context.close();
    await browser.close();
  }
  const outputPath = path.join(__dirname, 'interaction-probe.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({
    output: outputPath,
    resolvedStartUrl: report.resolvedStartUrl,
    controlCount: report.controls.length,
    invisibleOrDisabled: report.controls.filter((control) => !control.visible || control.disabled).length,
    localClicks: report.clicks,
    externalSkipped: report.skippedExternal.length
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
