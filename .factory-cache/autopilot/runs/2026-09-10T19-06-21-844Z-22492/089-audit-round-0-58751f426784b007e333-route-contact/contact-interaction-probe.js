const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.resolve(process.cwd(), 'scripts/factory/qa/browser.js'));

(async () => {
  const outputPath = path.resolve(
    process.cwd(),
    '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/audit-progress/58751f426784b007e333/contact-interaction-probe.json'
  );
  const discovery = discoverBrowser();
  if (!discovery.browser) {
    throw new Error('No supported local browser was found for the isolated interaction audit.');
  }

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const mutatingRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({
    url: request.url(),
    method: request.method(),
    error: request.failure() ? request.failure().errorText : null
  }));
  await page.route('**/*', async (route) => {
    const method = route.request().method();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      mutatingRequests.push({ url: route.request().url(), method });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  const response = await page.goto('https://autopilot.local/kontakt/', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  await page.waitForTimeout(500);

  const section = page.locator('[data-factory-section="contact-form"]');
  const form = section.locator('form');
  const fields = form.locator('input:not([type="submit"]):not([type="hidden"]), textarea');
  const fieldCount = await fields.count();
  const focusChecks = [];
  for (let index = 0; index < fieldCount; index += 1) {
    const field = fields.nth(index);
    await field.focus();
    focusChecks.push(await field.evaluate((element) => ({
      tag: element.tagName.toLowerCase(),
      type: element.getAttribute('type') || null,
      name: element.getAttribute('name') || null,
      placeholder: element.getAttribute('placeholder') || null,
      required: element.required,
      ariaRequired: element.getAttribute('aria-required'),
      visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length),
      disabled: element.disabled,
      focused: document.activeElement === element,
      rect: (() => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })()
    })));
  }

  const submit = form.locator('input[type="submit"], button[type="submit"]');
  await submit.focus();
  const result = {
    checkedAt: new Date().toISOString(),
    browser: discovery.browser.name,
    url: page.url(),
    httpStatus: response ? response.status() : null,
    title: await page.title(),
    form: {
      sectionVisible: await section.isVisible(),
      formCount: await form.count(),
      className: await form.getAttribute('class'),
      action: await form.getAttribute('action'),
      method: await form.getAttribute('method'),
      noValidate: await form.getAttribute('novalidate'),
      fields: focusChecks,
      submit: await submit.evaluate((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        value: element.value || element.textContent.trim(),
        visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length),
        disabled: element.disabled,
        focused: document.activeElement === element,
        rect: (() => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })()
      })),
      responseRegionCount: await form.locator('.wpcf7-response-output').count()
    },
    safeScope: {
      submitted: false,
      reason: 'Submission intentionally not triggered because the audit must not send email or create business side effects.',
      mutatingRequests
    },
    runtime: { consoleErrors, pageErrors, failedRequests }
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  process.stdout.write(JSON.stringify({
    output: path.relative(process.cwd(), outputPath).replace(/\\/g, '/'),
    httpStatus: result.httpStatus,
    fieldCount: result.form.fields.length,
    allVisible: result.form.fields.every((field) => field.visible),
    allFocusable: result.form.fields.every((field) => field.focused),
    submitVisible: result.form.submit.visible,
    submitFocusable: result.form.submit.focused,
    mutatingRequests: result.safeScope.mutatingRequests.length,
    consoleErrors: result.runtime.consoleErrors.length,
    pageErrors: result.runtime.pageErrors.length,
    failedRequests: result.runtime.failedRequests.length
  }, null, 2));
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
