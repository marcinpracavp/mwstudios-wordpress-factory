const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const targetUrl = 'https://autopilot.local/zamowienie/';
const outputPath = path.join(__dirname, 'interaction-probe-results.json');

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported system browser found');

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  const result = {
    generatedAt: new Date().toISOString(),
    browser: discovery.browser.name,
    isolatedContext: true,
    targetUrl,
    submittedForms: false,
    pageErrors: [],
    consoleErrors: [],
    controls: {},
    rememberCheckbox: {},
    registrationDialog: {},
    passwordRecovery: {},
    guestContinuation: {}
  };

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 900 }
    });

    const page = await context.newPage();
    page.on('pageerror', error => result.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') result.consoleErrors.push(message.text());
    });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    result.controls = await page.evaluate(() => {
      const login = document.querySelector('form[name="loginform"]');
      const username = login?.querySelector('input[name="log"]');
      const password = login?.querySelector('input[name="pwd"]');
      const submit = login?.querySelector('button[type="submit"]');
      const forgot = document.querySelector('.c-checkout-entry__outline-button');
      const guest = document.querySelector('.c-checkout-entry__guest a.c-checkout-entry__button');
      const register = document.querySelector('[data-checkout-registration-open]');
      return {
        loginFormPresent: Boolean(login),
        loginMethod: login?.method || null,
        loginAction: login?.action || null,
        username: username ? { type: username.type, required: username.required, autocomplete: username.autocomplete } : null,
        password: password ? { type: password.type, required: password.required, autocomplete: password.autocomplete } : null,
        loginSubmitPresent: Boolean(submit),
        forgotHref: forgot?.href || null,
        guestHref: guest?.href || null,
        registrationOpenerPresent: Boolean(register)
      };
    });

    const remember = page.locator('input[name="rememberme"]');
    result.rememberCheckbox.before = await remember.isChecked();
    await remember.check();
    result.rememberCheckbox.afterCheck = await remember.isChecked();
    await remember.uncheck();
    result.rememberCheckbox.afterReset = await remember.isChecked();

    const opener = page.locator('[data-checkout-registration-open]');
    const dialog = page.locator('[data-factory-section="account-registration-dialog"]');
    result.registrationDialog.initial = {
      hidden: await dialog.evaluate(element => element.hidden),
      expanded: await opener.getAttribute('aria-expanded')
    };
    await opener.click();
    result.registrationDialog.open = {
      hidden: await dialog.evaluate(element => element.hidden),
      expanded: await opener.getAttribute('aria-expanded'),
      firstInputFocused: await page.evaluate(() => {
        const active = document.activeElement;
        return Boolean(active && active.matches('[data-factory-section="account-registration-dialog"] input'));
      })
    };
    await page.keyboard.press('Escape');
    result.registrationDialog.closed = {
      hidden: await dialog.evaluate(element => element.hidden),
      expanded: await opener.getAttribute('aria-expanded'),
      focusReturned: await opener.evaluate(element => document.activeElement === element)
    };

    const recoveryPage = await context.newPage();
    await recoveryPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const recoveryHref = await recoveryPage.locator('.c-checkout-entry__outline-button').getAttribute('href');
    await Promise.all([
      recoveryPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      recoveryPage.locator('.c-checkout-entry__outline-button').click()
    ]);
    result.passwordRecovery = {
      href: recoveryHref,
      finalUrl: recoveryPage.url(),
      reachedLostPassword: /\/lost-password\//.test(recoveryPage.url())
    };

    const guestPage = await context.newPage();
    await guestPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const guestHref = await guestPage.locator('.c-checkout-entry__guest a.c-checkout-entry__button').getAttribute('href');
    await Promise.all([
      guestPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      guestPage.locator('.c-checkout-entry__guest a.c-checkout-entry__button').click()
    ]);
    result.guestContinuation = {
      href: guestHref,
      finalUrl: guestPage.url(),
      loginOptionsStillVisible: await guestPage.locator('[data-factory-section="checkout-login-options"]').isVisible(),
      advancedPastLoginStep: !(await guestPage.locator('[data-factory-section="checkout-login-options"]').isVisible())
    };

    await context.close();
  } finally {
    await browser.close();
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${outputPath}\n`);
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
