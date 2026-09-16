const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) {
    throw new Error('No supported browser discovered');
  }

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--disable-gpu', '--disable-background-networking']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  try {
    const response = await page.goto('https://autopilot.local/kariera/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    const details = page.locator('.c-career-vacancy');
    const summaries = page.locator('.c-career-vacancy > summary');
    const count = await details.count();
    const states = async () => details.evaluateAll((nodes) => nodes.map((node) => node.open));
    const initial = await states();

    await summaries.nth(1).click();
    const afterPointerOpenSecond = await states();
    await summaries.nth(1).click();
    const afterPointerCloseSecond = await states();

    await summaries.nth(2).focus();
    await page.keyboard.press('Enter');
    const afterKeyboardOpenThird = await states();
    await page.keyboard.press('Space');
    const afterKeyboardCloseThird = await states();

    const cta = page.locator('.c-careers-cta__button');
    const ctaHref = await cta.getAttribute('href');
    await cta.click();
    await page.waitForTimeout(100);

    const structure = await page.evaluate(() => ({
      hash: window.location.hash,
      targetCount: document.querySelectorAll('#career-application').length,
      visibleTargets: [...document.querySelectorAll('#career-application')].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      fileInputs: document.querySelectorAll('.c-careers-vacancies input[type="file"]').length,
      submitControls: document.querySelectorAll('.c-careers-vacancies input[type="submit"], .c-careers-vacancies button[type="submit"]').length,
      submitted: false
    }));

    console.log(JSON.stringify({
      browser: discovery.browser.name,
      responseStatus: response ? response.status() : null,
      count,
      initial,
      afterPointerOpenSecond,
      afterPointerCloseSecond,
      afterKeyboardOpenThird,
      afterKeyboardCloseThird,
      ctaHref,
      ...structure,
      pageErrors,
      consoleErrors
    }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
