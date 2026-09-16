const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser'));

const runDir = path.join(
  process.cwd(),
  '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/099-audit-round-0-58751f426784b007e333-route-account'
);
const resultPath = path.join(runDir, 'interaction-probe-result.json');
const screenshotPath = path.join(runDir, 'interaction-registration-open.png');
const lostScreenshotPath = path.join(runDir, 'interaction-lost-password.png');

async function main() {
  const found = discoverBrowser();
  const browser = await getChromium().launch({
    executablePath: found.browser.executablePath,
    headless: true,
  });
  const result = {
    url: 'https://autopilot.local/moje-konto/',
    isolatedContext: true,
    submissionsPerformed: 0,
    mutationsPerformed: ['focus', 'checkbox toggle then restore', 'details toggle then restore'],
    consoleErrors: [],
    pageErrors: [],
  };

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      ignoreHTTPSErrors: true,
      locale: 'pl-PL',
    });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') result.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => result.pageErrors.push(error.message));

    const response = await page.goto(result.url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    result.initial = {
      status: response ? response.status() : null,
      finalUrl: page.url(),
      title: await page.title(),
    };

    const login = page.locator('[data-factory-section="account-login"]');
    const registration = page.locator('[data-factory-section="account-registration"]');
    const username = login.locator('#username');
    const password = login.locator('#password');
    const remember = login.locator('input[name="rememberme"]');
    const loginForm = login.locator('form.woocommerce-form-login');
    const loginSubmit = login.locator('button[name="login"]');
    const lostLink = login.locator('.c-account__actions a');

    await username.focus();
    const usernameFocused = await username.evaluate((element) => document.activeElement === element);
    await password.focus();
    const passwordFocused = await password.evaluate((element) => document.activeElement === element);
    await remember.check();
    const rememberChecked = await remember.isChecked();
    await remember.uncheck();
    const rememberRestored = !(await remember.isChecked());

    result.login = {
      sectionVisible: await login.isVisible(),
      formVisible: await loginForm.isVisible(),
      formMethod: await loginForm.getAttribute('method'),
      formAction: await loginForm.getAttribute('action'),
      noncePresent: (await login.locator('input[name="woocommerce-login-nonce"]').count()) === 1,
      username: {
        visible: await username.isVisible(),
        required: await username.getAttribute('required'),
        autocomplete: await username.getAttribute('autocomplete'),
        focused: usernameFocused,
      },
      password: {
        visible: await password.isVisible(),
        required: await password.getAttribute('required'),
        autocomplete: await password.getAttribute('autocomplete'),
        focused: passwordFocused,
      },
      remember: {
        visible: await remember.isVisible(),
        toggledOn: rememberChecked,
        restoredOff: rememberRestored,
      },
      submit: {
        visible: await loginSubmit.isVisible(),
        type: await loginSubmit.getAttribute('type'),
        name: await loginSubmit.getAttribute('name'),
      },
      lostPasswordHref: await lostLink.getAttribute('href'),
    };

    const details = registration.locator('details.c-account__registration-details');
    const summary = details.locator('summary');
    const registrationForm = details.locator('form.woocommerce-form-register');
    const registrationSubmit = details.locator('button[name="register"]');
    result.registration = {
      sectionVisible: await registration.isVisible(),
      detailsInitiallyOpen: await details.evaluate((element) => element.open),
      summaryVisible: await summary.isVisible(),
    };

    await summary.click();
    await page.waitForTimeout(100);
    const regEmail = registrationForm.locator('#reg_email');
    const regPassword = registrationForm.locator('#reg_password');
    await regEmail.focus();
    const regEmailFocused = await regEmail.evaluate((element) => document.activeElement === element);
    await regPassword.focus();
    const regPasswordFocused = await regPassword.evaluate((element) => document.activeElement === element);
    result.registration.detailsOpened = await details.evaluate((element) => element.open);
    result.registration.formVisibleWhenOpen = await registrationForm.isVisible();
    result.registration.formMethod = await registrationForm.getAttribute('method');
    result.registration.formAction = await registrationForm.getAttribute('action');
    result.registration.noncePresent = (await details.locator('input[name="woocommerce-register-nonce"]').count()) === 1;
    result.registration.email = {
      visible: await regEmail.isVisible(),
      required: await regEmail.getAttribute('required'),
      autocomplete: await regEmail.getAttribute('autocomplete'),
      focused: regEmailFocused,
    };
    result.registration.password = {
      visible: await regPassword.isVisible(),
      required: await regPassword.getAttribute('required'),
      autocomplete: await regPassword.getAttribute('autocomplete'),
      focused: regPasswordFocused,
    };
    result.registration.submit = {
      visible: await registrationSubmit.isVisible(),
      type: await registrationSubmit.getAttribute('type'),
      name: await registrationSubmit.getAttribute('name'),
    };
    result.registration.panelBoxWhenOpen = await registration.boundingBox();
    result.registration.formBoxWhenOpen = await registrationForm.boundingBox();
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await summary.click();
    await page.waitForTimeout(100);
    result.registration.detailsRestoredClosed = !(await details.evaluate((element) => element.open));

    const lostPage = await context.newPage();
    const lostResponse = await lostPage.goto(result.login.lostPasswordHref, { waitUntil: 'networkidle' });
    result.lostPassword = {
      status: lostResponse ? lostResponse.status() : null,
      finalUrl: lostPage.url(),
      recoveryFormVisible: await lostPage.locator('form.woocommerce-ResetPassword').isVisible().catch(() => false),
      recoveryFormCount: await lostPage.locator('form.woocommerce-ResetPassword, form.lost_reset_password').count(),
      forms: await lostPage.locator('form').evaluateAll((forms) => forms.map((form) => ({
        className: form.className,
        method: form.method,
        action: form.action,
      }))),
      factorySections: await lostPage.locator('[data-factory-section]').evaluateAll((sections) => sections.map((section) => section.getAttribute('data-factory-section'))),
      mainText: (await lostPage.locator('main').innerText().catch(() => '')).slice(0, 500),
    };
    await lostPage.screenshot({ path: lostScreenshotPath, fullPage: true });
    await lostPage.close();
    await context.close();
  } finally {
    await browser.close();
  }

  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    resultPath: path.relative(process.cwd(), resultPath).replace(/\\/g, '/'),
    screenshotPath: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    lostScreenshotPath: path.relative(process.cwd(), lostScreenshotPath).replace(/\\/g, '/'),
    login: result.login,
    registration: result.registration,
    lostPassword: result.lostPassword,
    consoleErrorCount: result.consoleErrors.length,
    pageErrorCount: result.pageErrors.length,
  }, null, 2)}\n`);
}

main().catch((error) => {
  fs.writeFileSync(resultPath, `${JSON.stringify({ status: 'blocked', error: error.stack || error.message }, null, 2)}\n`, 'utf8');
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
