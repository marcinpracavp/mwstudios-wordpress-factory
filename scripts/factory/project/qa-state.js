async function prepare({ page, route, baseUrl }) {
  const visit = async (url) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(350);
  };
  if (route.id === 'checkout-login' || route.id === 'checkout-registration') {
    await visit(`${baseUrl}/koszyk/`);
    while (await page.locator('.woocommerce-cart-form .remove').count()) {
      await page.locator('.woocommerce-cart-form .remove').first().click();
      await page.waitForTimeout(350);
    }
    await visit(`${baseUrl}/zamowienie/`);
    if (route.id === 'checkout-registration') {
      await page.locator('[data-checkout-registration-open]').click();
      await page.locator('[data-factory-section="account-registration-dialog"] input').first().waitFor({ state: 'visible' });
    }
    return;
  }
  if (route.id === 'cart' || route.id === 'checkout') {
    await visit(`${baseUrl}/koszyk/`);
    while (await page.locator('.woocommerce-cart-form .remove').count()) {
      await page.locator('.woocommerce-cart-form .remove').first().click();
      await page.waitForTimeout(350);
    }
    await visit(`${baseUrl}/produkt/aquatos-5l/`);
    const size = page.locator('select[name^="attribute_"]').first();
    if (await size.count()) await size.selectOption({ label: '5 L' });
    await page.locator('.single_add_to_cart_button:not(.disabled)').waitFor({ state: 'visible' });
    await page.locator('.single_add_to_cart_button').click();
    await page.waitForTimeout(500);
    await visit(`${baseUrl}/koszyk/`);
    const coupon = page.locator('#coupon_code');
    if (await coupon.count()) {
      await coupon.fill('BLACKFRIDAY');
      await page.locator('button[name="apply_coupon"]').click();
      await page.waitForTimeout(500);
      // This consumes WooCommerce's transient success notice while retaining
      // the source-backed applied coupon in the real cart session.
      await visit(`${baseUrl}/koszyk/`);
    }
    if (route.id === 'checkout') await visit(`${baseUrl}/zamowienie/`);
    return;
  }
  if (route.id === 'product-bundle') await page.goto(`${baseUrl}/produkt/pakiet-ochronny-rzepaku-ozimego-12-ha/`, { waitUntil: 'networkidle' });
  const selectors = { 'home-active': '[data-primary-menu-toggle]', 'product-expanded': '[data-product-tab="use"]', 'product-inquiry': '[data-product-inquiry-open]', 'product-reviews-state': '[data-product-tab="reviews"]', 'product-files-state': '[data-product-tab="downloads"]' };
  const selector = selectors[route.id];
  if (selector) {
    await page.locator(selector).click();
    if (route.id === 'home-active') await page.locator('#primary-mega-menu').waitFor({ state: 'visible' });
  }
}
module.exports = { prepare };
