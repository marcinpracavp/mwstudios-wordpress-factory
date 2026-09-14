const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const outputPath = path.join(__dirname, 'interaction-audit.json');
const baseUrl = 'https://autopilot.local';
const results = [];

function record(id, route, passed, evidence) {
  results.push({ id, route, passed: Boolean(passed), evidence });
}

(async () => {
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(String(error.message || error)));

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const menuToggle = page.locator('[data-primary-menu-toggle]');
  await menuToggle.click();
  const menuOpen = await page.locator('#primary-mega-menu').evaluate((node) => ({
    hidden: node.hidden,
    bodyOpen: document.body.classList.contains('primary-menu-open'),
    expanded: document.querySelector('[data-primary-menu-toggle]')?.getAttribute('aria-expanded')
  }));
  record('INT-01', 'home', !menuOpen.hidden && menuOpen.bodyOpen && menuOpen.expanded === 'true', menuOpen);
  const categories = page.locator('[data-mega-category]');
  if (await categories.count() > 1) await categories.nth(1).click();
  const crops = page.locator('[data-mega-crop]');
  if (await crops.count() > 1) await crops.nth(1).click();
  const menuChoice = await page.evaluate(() => ({
    selectedCategories: [...document.querySelectorAll('[data-mega-category][aria-selected="true"]')].length,
    pressedCrops: [...document.querySelectorAll('[data-mega-crop][aria-pressed="true"]')].length
  }));
  record('INT-02', 'home-active', menuChoice.selectedCategories === 1 && menuChoice.pressedCrops === 1, menuChoice);
  await page.keyboard.press('Escape');
  const menuClosed = await page.locator('#primary-mega-menu').evaluate((node) => ({
    hidden: node.hidden,
    expanded: document.querySelector('[data-primary-menu-toggle]')?.getAttribute('aria-expanded')
  }));
  record('INT-03', 'home', menuClosed.hidden && menuClosed.expanded === 'false', menuClosed);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const mobileToggle = page.locator('.c-menu-mobile__toggler').first();
  await mobileToggle.click();
  const mobileOpen = await page.locator('.c-menu-mobile').first().evaluate((root) => ({
    active: root.querySelector('.c-menu-mobile__menu')?.classList.contains('is-active'),
    togglerOpen: root.querySelector('.c-menu-mobile__toggler')?.classList.contains('is-open'),
    bodyOverflow: document.body.style.overflow
  }));
  record('INT-04', 'home@390', mobileOpen.active && mobileOpen.togglerOpen && mobileOpen.bodyOverflow === 'hidden', mobileOpen);
  await mobileToggle.click();
  const mobileClosed = await page.locator('.c-menu-mobile').first().evaluate((root) => ({
    active: root.querySelector('.c-menu-mobile__menu')?.classList.contains('is-active'),
    bodyOverflow: document.body.style.overflow
  }));
  record('INT-05', 'home@390', !mobileClosed.active && mobileClosed.bodyOverflow === 'auto', mobileClosed);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/kariera/`, { waitUntil: 'networkidle' });
  const vacancies = page.locator('.c-career-vacancy');
  const vacancyCount = await vacancies.count();
  if (vacancyCount > 1) await vacancies.nth(1).locator('summary').click();
  const vacancyState = await page.evaluate(() => [...document.querySelectorAll('.c-career-vacancy')].map((node) => node.open));
  record('INT-06', 'careers', vacancyCount > 1 && vacancyState[1] === true, { count: vacancyCount, open: vacancyState });

  await page.goto(`${baseUrl}/produkt/aquatos-5l/`, { waitUntil: 'networkidle' });
  await page.locator('[data-product-tab="reviews"]').click();
  const reviewState = await page.evaluate(() => ({
    selected: document.querySelector('[data-product-tab="reviews"]')?.getAttribute('aria-selected'),
    active: document.querySelector('[data-product-panel="reviews"]')?.classList.contains('is-active'),
    hash: location.hash
  }));
  record('INT-07', 'product-reviews-state', reviewState.selected === 'true' && reviewState.active && reviewState.hash === '#reviews', reviewState);
  await page.locator('[data-product-tab="description"]').click();
  const expand = page.locator('[data-product-expand]');
  await expand.click();
  const expandedState = await page.evaluate(() => ({
    open: document.querySelector('[data-product-expanded]')?.classList.contains('is-open'),
    triggerHidden: document.querySelector('[data-product-expand]')?.hidden
  }));
  record('INT-08', 'product-expanded', expandedState.open && expandedState.triggerHidden, expandedState);
  await page.locator('[data-product-inquiry-open]').click();
  const inquiryOpen = await page.evaluate(() => ({
    open: document.querySelector('[data-product-inquiry]')?.classList.contains('is-open'),
    ariaHidden: document.querySelector('[data-product-inquiry]')?.getAttribute('aria-hidden')
  }));
  await page.locator('[data-product-inquiry-close]').click();
  const inquiryClosed = await page.evaluate(() => ({
    open: document.querySelector('[data-product-inquiry]')?.classList.contains('is-open'),
    ariaHidden: document.querySelector('[data-product-inquiry]')?.getAttribute('aria-hidden')
  }));
  record('INT-09', 'product-inquiry', inquiryOpen.open && inquiryOpen.ariaHidden === 'false' && !inquiryClosed.open && inquiryClosed.ariaHidden === 'true', { open: inquiryOpen, closed: inquiryClosed });
  await page.locator('[data-product-tab="downloads"]').click();
  const downloadState = await page.evaluate(() => ({
    selected: document.querySelector('[data-product-tab="downloads"]')?.getAttribute('aria-selected'),
    active: document.querySelector('[data-product-panel="downloads"]')?.classList.contains('is-active')
  }));
  record('INT-10', 'product-files-state', downloadState.selected === 'true' && downloadState.active, downloadState);

  await page.goto(`${baseUrl}/zamowienie/`, { waitUntil: 'networkidle' });
  const registrationOpen = page.locator('[data-checkout-registration-open]');
  if (await registrationOpen.count()) {
    await registrationOpen.click();
    const dialogState = await page.evaluate(() => ({
      hidden: document.querySelector('[data-factory-section="account-registration-dialog"]')?.hidden,
      expanded: document.querySelector('[data-checkout-registration-open]')?.getAttribute('aria-expanded')
    }));
    await page.keyboard.press('Escape');
    const dialogClosed = await page.evaluate(() => ({
      hidden: document.querySelector('[data-factory-section="account-registration-dialog"]')?.hidden,
      expanded: document.querySelector('[data-checkout-registration-open]')?.getAttribute('aria-expanded')
    }));
    record('INT-11', 'checkout-registration', dialogState.hidden === false && dialogState.expanded === 'true' && dialogClosed.hidden === true && dialogClosed.expanded === 'false', { open: dialogState, closed: dialogClosed });
  } else {
    record('INT-11', 'checkout-registration', false, { reason: 'registration opener absent on current checkout session' });
  }

  record('INT-12', 'runtime', runtimeErrors.length === 0, { pageErrors: runtimeErrors });
  await context.close();
  await browser.close();
  fs.writeFileSync(outputPath, `${JSON.stringify({ browser: discovery.browser.name, generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, passed: results.filter((item) => item.passed).length, failed: results.filter((item) => !item.passed).map((item) => item.id) }));
})().catch((error) => {
  fs.writeFileSync(outputPath, `${JSON.stringify({ fatal: String(error.stack || error), results }, null, 2)}\n`);
  console.error(error.stack || error);
  process.exitCode = 1;
});
