const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const outputPath = path.join(__dirname, 'interaction-live-probe.json');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  try {
    await page.goto('https://autopilot.local/zamowienie/', { waitUntil: 'networkidle' });
    const opener = page.locator('[data-checkout-registration-open]');
    const dialog = page.locator('[data-factory-section="account-registration-dialog"]');
    const terms = dialog.locator('.c-checkout-entry__terms input[type="checkbox"]');

    const initial = {
      openerCount: await opener.count(),
      dialogCount: await dialog.count(),
      hidden: await dialog.getAttribute('hidden') !== null,
      expanded: await opener.getAttribute('aria-expanded')
    };

    await opener.click();
    const open = await dialog.evaluate((node) => ({
      hidden: node.hidden,
      role: node.getAttribute('role'),
      ariaModal: node.getAttribute('aria-modal'),
      activeInside: node.contains(document.activeElement),
      activeName: document.activeElement && document.activeElement.getAttribute('name')
    }));
    open.expanded = await opener.getAttribute('aria-expanded');

    const controls = await dialog.locator('button, [role="button"]').evaluateAll((nodes) => nodes.map((node) => ({
      text: (node.textContent || '').trim(),
      type: node.getAttribute('type'),
      ariaLabel: node.getAttribute('aria-label'),
      visible: Boolean(node.getClientRects().length)
    })));

    await page.keyboard.press('Shift+Tab');
    const focusContainment = await dialog.evaluate((node) => ({
      activeInside: node.contains(document.activeElement),
      activeTag: document.activeElement && document.activeElement.tagName,
      activeText: document.activeElement && (document.activeElement.textContent || '').trim()
    }));

    const termsBoundingBox = await terms.boundingBox();
    let pointerToggle;
    try {
      await terms.click({ timeout: 2000 });
      const checkedAfterClick = await terms.isChecked();
      await terms.click({ timeout: 2000 });
      pointerToggle = {
        reachable: true,
        checkedAfterClick,
        checkedAfterSecondClick: await terms.isChecked()
      };
    } catch (error) {
      pointerToggle = {
        reachable: false,
        error: String(error.message || error).split('\n')[0]
      };
    }

    await dialog.locator('input').first().focus();
    for (let index = 0; index < 6; index += 1) await page.keyboard.press('Tab');
    const termsReachedByKeyboard = await terms.evaluate((node) => document.activeElement === node);
    let keyboardToggle = null;
    if (termsReachedByKeyboard) {
      await page.keyboard.press('Space');
      const checkedAfterSpace = await terms.isChecked();
      await page.keyboard.press('Space');
      keyboardToggle = {
        checkedAfterSpace,
        checkedAfterSecondSpace: await terms.isChecked()
      };
    }

    await page.keyboard.press('Escape');
    const closed = {
      hidden: await dialog.getAttribute('hidden') !== null,
      expanded: await opener.getAttribute('aria-expanded'),
      focusReturnedToOpener: await opener.evaluate((node) => document.activeElement === node)
    };

    const result = {
      generatedAt: new Date().toISOString(),
      browser: discovery.browser.name,
      isolatedContext: true,
      url: page.url(),
      submittedForms: false,
      initial,
      open,
      controls,
      focusContainment,
      termsToggle: {
        boundingBox: termsBoundingBox,
        pointer: pointerToggle,
        reachedByKeyboard: termsReachedByKeyboard,
        keyboard: keyboardToggle
      },
      closed,
      pageErrors
    };
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
    process.stdout.write(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  fs.writeFileSync(outputPath, JSON.stringify({ error: String(error && error.stack || error) }, null, 2) + '\n', 'utf8');
  console.error(error);
  process.exitCode = 1;
});
