const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.join(process.cwd(), 'scripts/factory/qa/browser'));

async function main() {
  const outputPath = process.argv[2];
  if (!outputPath) throw new Error('Missing output path');
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  const result = {
    generatedAt: new Date().toISOString(),
    browser: discovery.browser.name,
    isolatedContext: true,
    sourceBackedProductId: 121,
    placedOrder: false,
    submittedPayment: false,
    sentMessage: false,
    registrationSubmitted: false,
    checkout: {},
    pageErrors
  };

  try {
    await page.goto('https://autopilot.local/?add-to-cart=121', { waitUntil: 'networkidle', timeout: 30000 });
    await page.goto('https://autopilot.local/zamowienie/', { waitUntil: 'networkidle', timeout: 30000 });
    result.checkout.url = page.url();
    result.checkout.formCount = await page.locator('form.checkout').count();
    result.checkout.placeOrder = await page.locator('#place_order').evaluate((button) => ({
      visible: Boolean(button.offsetWidth || button.offsetHeight || button.getClientRects().length),
      disabled: button.disabled,
      formName: button.form ? button.form.getAttribute('name') : null
    }));

    const shipCheckbox = page.locator('#ship-to-different-address-checkbox');
    result.checkout.shipDifferent = { count: await shipCheckbox.count() };
    if (result.checkout.shipDifferent.count === 1) {
      result.checkout.shipDifferent.before = await shipCheckbox.isChecked();
      await shipCheckbox.check();
      result.checkout.shipDifferent.afterCheck = await shipCheckbox.isChecked();
      await shipCheckbox.uncheck();
      result.checkout.shipDifferent.afterRestore = await shipCheckbox.isChecked();
    }

    result.checkout.paymentMethods = await page.locator('input[name="payment_method"]').evaluateAll((nodes) => nodes.map((node) => ({
      id: node.id,
      value: node.value,
      checked: node.checked,
      visible: Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length)
    })));
    result.checkout.shippingMethods = await page.locator('input[name^="shipping_method"]').evaluateAll((nodes) => nodes.map((node) => ({
      id: node.id,
      value: node.value,
      checked: node.checked,
      visible: Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length)
    })));

    const couponInput = page.locator('#coupon_code');
    const couponButton = page.locator('button[name="apply_coupon"]');
    result.checkout.coupon = {
      inputCount: await couponInput.count(),
      buttonCount: await couponButton.count()
    };
    if (result.checkout.coupon.inputCount === 1 && result.checkout.coupon.buttonCount === 1) {
      result.checkout.coupon.formOwnership = await couponButton.evaluate((button) => ({
        formClass: button.form ? button.form.className : null,
        formName: button.form ? button.form.getAttribute('name') : null,
        formAction: button.form ? button.form.action : null
      }));
      await couponInput.fill('BLACKFRIDAY');
      result.checkout.coupon.acceptedSourceValue = await couponInput.inputValue();
      await couponInput.fill('');
      result.checkout.coupon.restoredEmpty = (await couponInput.inputValue()) === '';
      result.checkout.coupon.submitted = false;
    }
  } finally {
    await context.close();
    await browser.close();
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify({
    outputPath,
    formCount: result.checkout.formCount,
    shipDifferent: result.checkout.shipDifferent,
    paymentMethodCount: result.checkout.paymentMethods ? result.checkout.paymentMethods.length : null,
    shippingMethodCount: result.checkout.shippingMethods ? result.checkout.shippingMethods.length : null,
    coupon: result.checkout.coupon,
    placedOrder: result.placedOrder,
    pageErrors: result.pageErrors
  }, null, 2));
}

main().catch((error) => {
  process.stderr.write(error.stack || String(error));
  process.exitCode = 1;
});
