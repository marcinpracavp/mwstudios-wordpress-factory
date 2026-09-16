const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const runDir = __dirname;
const outputPath = path.join(runDir, 'fresh-browser-probe.json');
const { browser: discovered } = discoverBrowser();

if (!discovered) {
  throw new Error('No supported system browser found');
}

function clean(value) {
  return JSON.parse(JSON.stringify(value));
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(800);
}

async function responsiveProbe(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto('https://autopilot.local/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await settle(page);
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const pageSections = [...document.querySelectorAll('[data-factory-section]')]
      .filter((element) => !String(element.dataset.factorySection || '').startsWith('shared-'));
    const sectionGeometry = pageSections.map((element) => {
      const rect = element.getBoundingClientRect();
      const cards = [...element.querySelectorAll('.c-home-card')].filter(visible).map((card) => {
        const cardRect = card.getBoundingClientRect();
        const visibleWidth = Math.max(0, Math.min(cardRect.right, viewportWidth) - Math.max(cardRect.left, 0));
        return {
          left: Math.round(cardRect.left * 100) / 100,
          right: Math.round(cardRect.right * 100) / 100,
          width: Math.round(cardRect.width * 100) / 100,
          visibleWidth: Math.round(visibleWidth * 100) / 100,
          visibleRatio: cardRect.width ? Math.round((visibleWidth / cardRect.width) * 1000) / 1000 : 0,
          text: (card.querySelector('h3')?.textContent || '').trim()
        };
      });
      return {
        id: element.dataset.factorySection,
        left: Math.round(rect.left * 100) / 100,
        right: Math.round(rect.right * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        overflowX: getComputedStyle(element).overflowX,
        cards
      };
    });
    const clippedControls = [...document.querySelectorAll('a[href],button,input,select,textarea')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          section: element.closest('[data-factory-section]')?.dataset.factorySection || null
        };
      })
      .filter((item) => item.section && !String(item.section).startsWith('shared-') && (item.left < -1 || item.right > viewportWidth + 1));
    return {
      url: location.href,
      title: document.title,
      viewportWidth,
      innerWidth: window.innerWidth,
      documentHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
      fontsReady: !document.fonts || document.fonts.status === 'loaded',
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      sectionGeometry,
      clippedControls
    };
  });
  await context.close();
  return { width, status: response?.status() || null, pageErrors, ...result };
}

async function interactionProbe(browser) {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
  const desktop = await desktopContext.newPage();
  const desktopErrors = [];
  desktop.on('pageerror', (error) => desktopErrors.push(error.message));
  const desktopResponse = await desktop.goto('https://autopilot.local/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await settle(desktop);
  const toggle = desktop.locator('[data-primary-menu-toggle]');
  const menu = desktop.locator('#primary-mega-menu');
  const initial = {
    toggleVisible: await toggle.isVisible(),
    menuHidden: await menu.getAttribute('hidden') !== null,
    expanded: await toggle.getAttribute('aria-expanded')
  };
  await toggle.click();
  const opened = await desktop.evaluate(() => ({
    menuHidden: document.querySelector('#primary-mega-menu').hidden,
    expanded: document.querySelector('[data-primary-menu-toggle]').getAttribute('aria-expanded'),
    bodyOpen: document.body.classList.contains('primary-menu-open')
  }));
  const categories = desktop.locator('#primary-mega-menu [data-mega-category]');
  const crops = desktop.locator('#primary-mega-menu [data-mega-crop]');
  if (await categories.count() > 1) await categories.nth(1).click();
  if (await crops.count() > 1) await crops.nth(1).click();
  const selection = await desktop.evaluate(() => ({
    categoryCount: document.querySelectorAll('#primary-mega-menu [data-mega-category]').length,
    selectedCategories: document.querySelectorAll('#primary-mega-menu [data-mega-category][aria-selected="true"]').length,
    selectedCategoryText: document.querySelector('#primary-mega-menu [data-mega-category][aria-selected="true"]')?.textContent.trim() || null,
    cropCount: document.querySelectorAll('#primary-mega-menu [data-mega-crop]').length,
    pressedCrops: document.querySelectorAll('#primary-mega-menu [data-mega-crop][aria-pressed="true"]').length,
    pressedCropText: document.querySelector('#primary-mega-menu [data-mega-crop][aria-pressed="true"]')?.textContent.trim() || null
  }));
  await desktop.keyboard.press('Escape');
  const closed = await desktop.evaluate(() => ({
    menuHidden: document.querySelector('#primary-mega-menu').hidden,
    expanded: document.querySelector('[data-primary-menu-toggle]').getAttribute('aria-expanded'),
    bodyOpen: document.body.classList.contains('primary-menu-open')
  }));
  const linkInventory = await desktop.evaluate(() => ({
    productCardLinks: document.querySelectorAll('.c-home-card a[href]').length,
    addToCartLinks: document.querySelectorAll('.c-home-card a[href*="add-to-cart"]').length,
    forms: [...document.forms].map((form) => ({ method: form.method, action: form.action, role: form.getAttribute('role') }))
  }));
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
  const mobile = await mobileContext.newPage();
  const mobileErrors = [];
  mobile.on('pageerror', (error) => mobileErrors.push(error.message));
  const mobileResponse = await mobile.goto('https://autopilot.local/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await settle(mobile);
  const mobileToggle = mobile.locator('.c-menu-mobile__toggler');
  const mobileInitial = {
    togglerVisible: await mobileToggle.isVisible(),
    menuActive: await mobile.locator('.c-menu-mobile__menu').evaluate((element) => element.classList.contains('is-active')),
    bodyOverflow: await mobile.locator('body').evaluate((element) => getComputedStyle(element).overflow)
  };
  await mobileToggle.click();
  const mobileOpened = await mobile.evaluate(() => ({
    togglerOpen: document.querySelector('.c-menu-mobile__toggler').classList.contains('is-open'),
    menuActive: document.querySelector('.c-menu-mobile__menu').classList.contains('is-active'),
    bodyOverflow: getComputedStyle(document.body).overflow,
    menuVisible: (() => { const element = document.querySelector('.c-menu-mobile__menu'); const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0; })()
  }));
  await mobileToggle.click();
  const mobileClosed = await mobile.evaluate(() => ({
    togglerOpen: document.querySelector('.c-menu-mobile__toggler').classList.contains('is-open'),
    menuActive: document.querySelector('.c-menu-mobile__menu').classList.contains('is-active'),
    bodyOverflow: getComputedStyle(document.body).overflow
  }));
  await mobileContext.close();
  return {
    desktop: { status: desktopResponse?.status() || null, pageErrors: desktopErrors, initial, opened, selection, closed, linkInventory },
    mobile: { status: mobileResponse?.status() || null, pageErrors: mobileErrors, initial: mobileInitial, opened: mobileOpened, closed: mobileClosed },
    businessSideEffects: { submittedForms: false, clickedAddToCart: false, placedOrders: false, sentMessages: false }
  };
}

(async () => {
  const chromium = getChromium();
  const browser = await chromium.launch({ executablePath: discovered.executablePath, headless: true });
  try {
    const responsive = [];
    for (const width of [375, 390, 768, 1024, 1280, 1440]) responsive.push(await responsiveProbe(browser, width));
    const interactions = await interactionProbe(browser);
    const output = clean({ generatedAt: new Date().toISOString(), browser: discovered.name, responsive, interactions });
    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    process.stdout.write(JSON.stringify({ output: path.relative(process.cwd(), outputPath).replace(/\\/g, '/'), widths: responsive.map((item) => ({ width: item.width, overflowPx: item.overflowPx, clippedControls: item.clippedControls.length, pageErrors: item.pageErrors.length })), interactions }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
