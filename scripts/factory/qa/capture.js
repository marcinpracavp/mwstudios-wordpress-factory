const path = require('path');
const { ensureDirectory, relativePath, safeFileName, writeJson } = require('./utils');

const STATIC_VISUAL_CSS = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
  html { scroll-behavior: auto !important; }
`;

async function waitForPageReady(page) {
  const fonts = await page.evaluate(async () => {
    if (!document.fonts) {
      return { supported: false, ready: false };
    }

    const settled = await Promise.race([
      document.fonts.ready.then(() => true),
      new Promise((resolve) => window.setTimeout(() => resolve(false), 10000))
    ]);
    return { supported: true, ready: settled && document.fonts.status === 'loaded' };
  });

  const networkIdle = await page.waitForLoadState('networkidle', { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  const imagesSettled = await page.waitForFunction(
    () => Array.from(document.images).every((image) => image.complete),
    { timeout: 10000 }
  ).then(() => true).catch(() => false);

  return { fonts, networkIdle, imagesSettled };
}

async function collectPageMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const bodyRect = body ? body.getBoundingClientRect() : null;
    const getFontFamily = (selector) => {
      const element = document.querySelector(selector);
      return element ? window.getComputedStyle(element).fontFamily : null;
    };
    const sections = Array.from(document.querySelectorAll('[data-factory-section]')).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute('data-factory-section'),
        x: Math.round(rect.x + window.scrollX),
        y: Math.round(rect.y + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    });
    const images = Array.from(document.images)
      .filter((image) => image.src && (!image.complete || image.naturalWidth === 0))
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt || '' }));
    const scrollWidth = root.scrollWidth;
    const clientWidth = root.clientWidth;

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: Math.max(root.scrollWidth, body ? body.scrollWidth : 0),
      documentHeight: Math.max(root.scrollHeight, body ? body.scrollHeight : 0),
      scrollWidth,
      scrollHeight: root.scrollHeight,
      documentElementClientWidth: clientWidth,
      documentElementClientHeight: root.clientHeight,
      body: body
        ? {
          width: Math.round(bodyRect.width),
          height: Math.round(bodyRect.height),
          scrollWidth: body.scrollWidth,
          scrollHeight: body.scrollHeight
        }
        : null,
      horizontalOverflow: scrollWidth > clientWidth + 1,
      horizontalOverflowDelta: Math.max(0, scrollWidth - clientWidth),
      sections,
      brokenImages: images,
      fonts: {
        apiSupported: Boolean(document.fonts),
        ready: Boolean(document.fonts && document.fonts.status === 'loaded'),
        families: {
          body: getFontFamily('body'),
          h1: getFontFamily('h1'),
          h2: getFontFamily('h2'),
          h3: getFontFamily('h3')
        }
      }
    };
  });
}

function registerPageListeners(page) {
  const consoleEvents = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      const location = message.location();
      consoleEvents.push({
        type: message.type(),
        message: message.text(),
        url: location && location.url ? location.url : null
      });
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push({ type: 'pageerror', message: error.message, url: null });
  });
  page.on('requestfailed', (request) => {
    requestFailures.push({
      type: request.resourceType(),
      url: request.url(),
      message: request.failure() ? request.failure().errorText : 'Request failed'
    });
  });

  return { consoleEvents, pageErrors, requestFailures };
}

async function captureSections({ page, outputDir, sections, sectionFilter }) {
  const sectionsDir = ensureDirectory(path.join(outputDir, 'sections'));
  const seenNames = new Map();
  const capturedSections = [];

  for (const [index, section] of sections.entries()) {
    if (sectionFilter && section.id !== sectionFilter) {
      continue;
    }
    const baseName = safeFileName(section.id || `section-${index + 1}`);
    const count = seenNames.get(baseName) || 0;
    seenNames.set(baseName, count + 1);
    const filename = `${baseName}${count > 0 ? `-${count + 1}` : ''}.png`;
    const screenshotPath = path.join(sectionsDir, filename);
    const locator = page.locator('[data-factory-section]').nth(index);

    await locator.screenshot({ path: screenshotPath });
    capturedSections.push({
      ...section,
      screenshot: `sections/${filename}`
    });
  }

  return capturedSections;
}

async function capturePage({ browser, target, outputDir, sectionFilter }) {
  ensureDirectory(outputDir);
  const context = await browser.newContext({
    viewport: { width: target.viewport.width, height: target.viewport.height },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const listeners = registerPageListeners(page);
  const result = {
    language: target.language.id,
    languagePath: target.language.path,
    route: target.route.id,
    routePath: target.route.path,
    viewport: target.viewport,
    url: target.url,
    checks: {},
    errors: [],
    warnings: [],
    paths: {}
  };

  try {
    let response;
    try {
      response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (error) {
      result.checks.http = { status: 'FAIL', statusCode: null, message: error.message };
      result.errors.push({ type: 'http', message: error.message, url: target.url });
      return result;
    }

    const statusCode = response ? response.status() : null;
    result.checks.http = {
      status: statusCode !== null && statusCode < 400 ? 'PASS' : 'FAIL',
      statusCode
    };
    if (result.checks.http.status === 'FAIL') {
      result.errors.push({
        type: 'http',
        message: `HTTP ${statusCode === null ? 'response unavailable' : statusCode}`,
        url: target.url
      });
    }

    const readiness = await waitForPageReady(page);
    await page.addStyleTag({ content: STATIC_VISUAL_CSS });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop();
      }
    });

    const fullScreenshotPath = path.join(outputDir, 'full.png');
    await page.screenshot({ path: fullScreenshotPath, fullPage: true });
    result.paths.fullScreenshot = relativePath(outputDir, fullScreenshotPath);
    result.checks.screenshot = { status: 'PASS' };

    const metrics = await collectPageMetrics(page);
    metrics.fonts.ready = readiness.fonts.ready;
    metrics.readiness = readiness;
    const failedImageRequests = listeners.requestFailures.filter((failure) => failure.type === 'image');
    const brokenAssets = [...metrics.brokenImages, ...failedImageRequests.map((failure) => ({
      src: failure.url,
      alt: '',
      failure: failure.message
    }))];
    const capturedSections = await captureSections({
      page,
      outputDir,
      sections: metrics.sections,
      sectionFilter
    });
    const sectionFilterFound = !sectionFilter || metrics.sections.some((section) => section.id === sectionFilter);
    if (sectionFilter && !sectionFilterFound) {
      result.warnings.push({ type: 'section', message: `Section "${sectionFilter}" was not found.`, url: target.url });
    }

    writeJson(path.join(outputDir, 'metrics.json'), metrics);
    writeJson(path.join(outputDir, 'sections.json'), capturedSections);
    writeJson(path.join(outputDir, 'console.json'), {
      events: listeners.consoleEvents,
      pageErrors: listeners.pageErrors
    });
    writeJson(path.join(outputDir, 'network.json'), {
      requestFailures: listeners.requestFailures,
      brokenAssets
    });
    result.paths.metrics = 'metrics.json';
    result.paths.sections = 'sections.json';
    result.paths.console = 'console.json';
    result.paths.network = 'network.json';
    result.metrics = metrics;
    result.sections = capturedSections;
    result.sectionCount = metrics.sections.length;
    result.brokenAssets = brokenAssets;
    result.consoleEvents = listeners.consoleEvents;
    result.pageErrors = listeners.pageErrors;
    result.checks.horizontalOverflow = {
      status: metrics.horizontalOverflow ? 'FAIL' : 'PASS',
      delta: metrics.horizontalOverflowDelta,
      clientWidth: metrics.documentElementClientWidth,
      scrollWidth: metrics.scrollWidth
    };
    result.checks.console = {
      status: listeners.consoleEvents.some((event) => event.type === 'error') || listeners.pageErrors.length > 0
        ? 'FAIL'
        : 'PASS',
      errorCount: listeners.consoleEvents.filter((event) => event.type === 'error').length,
      warningCount: listeners.consoleEvents.filter((event) => event.type === 'warning').length,
      pageErrorCount: listeners.pageErrors.length
    };
    result.checks.brokenAssets = { status: brokenAssets.length > 0 ? 'FAIL' : 'PASS', count: brokenAssets.length };

    if (metrics.horizontalOverflow) {
      result.errors.push({ type: 'horizontal-overflow', message: `Overflow: +${metrics.horizontalOverflowDelta}px`, url: target.url });
    }
    listeners.consoleEvents.filter((event) => event.type === 'error').forEach((event) => result.errors.push(event));
    listeners.pageErrors.forEach((event) => result.errors.push(event));
    listeners.consoleEvents.filter((event) => event.type === 'warning').forEach((event) => result.warnings.push(event));
    brokenAssets.forEach((asset) => result.errors.push({
      type: 'broken-asset',
      message: asset.src,
      url: asset.src
    }));
  } catch (error) {
    result.checks.capture = { status: 'FAIL', message: error.message };
    result.errors.push({ type: 'capture', message: error.message, url: target.url });
  } finally {
    await context.close();
  }

  return result;
}

module.exports = {
  capturePage,
  collectPageMetrics,
  waitForPageReady
};
