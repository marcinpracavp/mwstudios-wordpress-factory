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

function textMatches(actual, expected, mode = 'contains') {
  return mode === 'exact' ? actual.trim() === expected : actual.includes(expected);
}

function accessibleNameFromElement(element) {
  const labelledBy = (element.getAttribute('aria-labelledby') || '').trim();
  if (labelledBy) {
    const value = labelledBy.split(/\s+/).map((id) => {
      const label = document.getElementById(id);
      return label ? label.textContent.trim() : '';
    }).filter(Boolean).join(' ').trim();
    if (value) {
      return value;
    }
  }
  const ariaLabel = (element.getAttribute('aria-label') || '').trim();
  if (ariaLabel) {
    return ariaLabel;
  }
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }
  }
  const wrappingLabel = element.closest('label');
  if (wrappingLabel && wrappingLabel.textContent.trim()) {
    return wrappingLabel.textContent.trim();
  }
  if (element.tagName === 'IMG') {
    return element.getAttribute('alt') || '';
  }
  const title = (element.getAttribute('title') || '').trim();
  if (title) {
    return title;
  }
  return element.textContent.trim();
}

async function executeInteractionStep(page, step, listeners, baseline) {
  const timeout = step.timeoutMs ?? 10000;
  if (step.action === 'click') {
    await page.locator(step.selector).click({ timeout });
    return `clicked ${step.selector}`;
  }
  if (step.action === 'fill') {
    await page.locator(step.selector).fill(step.value, { timeout });
    return `filled ${step.selector}`;
  }
  if (step.action === 'press') {
    await page.locator(step.selector).press(step.key, { timeout });
    return `pressed ${step.key} on ${step.selector}`;
  }
  if (step.action === 'submit') {
    const locator = page.locator(step.selector);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.evaluate((element) => {
      const form = element.tagName === 'FORM' ? element : element.closest('form');
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit(element.tagName === 'BUTTON' || element.tagName === 'INPUT' ? element : undefined);
      } else {
        element.click();
      }
    });
    return `submitted ${step.selector}`;
  }
  if (step.action === 'wait') {
    await page.waitForTimeout(step.timeoutMs ?? 250);
    return `waited ${step.timeoutMs ?? 250}ms`;
  }
  if (step.action === 'assertVisible') {
    await page.locator(step.selector).waitFor({ state: 'visible', timeout });
    return `${step.selector} is visible`;
  }
  if (step.action === 'assertUrl') {
    await page.waitForFunction(
      ({ expected, mode }) => mode === 'exact'
        ? window.location.href === expected || window.location.pathname === expected
        : window.location.href.includes(expected),
      { expected: step.url, mode: step.match || 'contains' },
      { timeout }
    );
    return `URL ${step.match || 'contains'} ${step.url}`;
  }
  if (step.action === 'assertText') {
    const actual = await page.locator(step.selector).innerText({ timeout });
    if (!textMatches(actual, step.text, step.match || 'contains')) {
      throw new Error(`Text assertion failed for ${step.selector}.`);
    }
    return `text ${step.match || 'contains'} expected value`;
  }
  if (step.action === 'assertCount') {
    const count = await page.locator(step.selector).count();
    if (count !== step.count) {
      throw new Error(`Count assertion failed for ${step.selector}: expected ${step.count}, received ${count}.`);
    }
    return `${step.selector} count is ${count}`;
  }
  if (step.action === 'assertAttribute') {
    const actual = await page.locator(step.selector).getAttribute(step.attribute, { timeout });
    if (actual !== step.value) {
      throw new Error(`Attribute assertion failed for ${step.selector}: ${step.attribute} expected "${step.value}", received "${actual}".`);
    }
    return `${step.selector} ${step.attribute} is ${step.value}`;
  }
  if (step.action === 'assertTagName') {
    const actual = await page.locator(step.selector).evaluate((element) => element.tagName.toLowerCase(), null, { timeout });
    if (actual !== step.tagName.toLowerCase()) {
      throw new Error(`Tag assertion failed for ${step.selector}: expected ${step.tagName}, received ${actual}.`);
    }
    return `${step.selector} is a ${actual}`;
  }
  if (step.action === 'assertFocused') {
    const focused = await page.locator(step.selector).evaluate((element) => document.activeElement === element, null, { timeout });
    if (!focused) {
      throw new Error(`Focus assertion failed for ${step.selector}.`);
    }
    return `${step.selector} retains focus`;
  }
  if (step.action === 'assertAccessibleName') {
    const actual = await page.locator(step.selector).evaluate(accessibleNameFromElement, null, { timeout });
    if (!textMatches(actual, step.name, step.match || 'contains')) {
      throw new Error(`Accessible-name assertion failed for ${step.selector}.`);
    }
    return `${step.selector} accessible name ${step.match || 'contains'} expected value`;
  }
  if (step.action === 'assertNoConsoleError') {
    const consoleErrors = listeners.consoleEvents.slice(baseline.consoleEvents)
      .filter((event) => event.type === 'error');
    const pageErrors = listeners.pageErrors.slice(baseline.pageErrors);
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      throw new Error(`Interaction produced ${consoleErrors.length} console error(s) and ${pageErrors.length} page error(s).`);
    }
    return 'no console or page errors after recipe start';
  }
  throw new Error(`Unsupported interaction action "${step.action}".`);
}

async function executeInteractionRecipe({ page, recipe, target, listeners }) {
  const startedAt = new Date().toISOString();
  const baseline = {
    consoleEvents: listeners.consoleEvents.length,
    pageErrors: listeners.pageErrors.length,
    requestFailures: listeners.requestFailures.length
  };
  const result = {
    id: recipe.id,
    capability: recipe.capability,
    route: target.route.id,
    language: target.language.id,
    viewport: target.viewport.id,
    status: 'PASS',
    startedAt,
    finishedAt: null,
    steps: [],
    error: null
  };
  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageReady(page);
    for (const [index, step] of recipe.steps.entries()) {
      const stepResult = { index: index + 1, action: step.action, status: 'PASS', evidence: null };
      try {
        stepResult.evidence = await executeInteractionStep(page, step, listeners, baseline);
      } catch (error) {
        stepResult.status = 'FAIL';
        stepResult.evidence = error.message;
        result.steps.push(stepResult);
        throw error;
      }
      result.steps.push(stepResult);
    }
  } catch (error) {
    result.status = 'FAIL';
    result.error = error.message;
  }
  result.finishedAt = new Date().toISOString();
  return result;
}

async function capturePage({ browser, target, outputDir, sectionFilter, interactions = [] }) {
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

    const interactionResults = [];
    for (const recipe of interactions) {
      interactionResults.push(await executeInteractionRecipe({
        page,
        recipe,
        target,
        listeners
      }));
    }
    writeJson(path.join(outputDir, 'interactions.json'), interactionResults);
    result.paths.interactions = 'interactions.json';
    result.interactions = interactionResults;
    result.checks.interactions = interactions.length === 0
      ? { status: 'SKIPPED', count: 0, failed: 0 }
      : {
        status: interactionResults.some((interaction) => interaction.status === 'FAIL') ? 'FAIL' : 'PASS',
        count: interactionResults.length,
        failed: interactionResults.filter((interaction) => interaction.status === 'FAIL').length
      };
    result.checks.console = {
      status: listeners.consoleEvents.some((event) => event.type === 'error') || listeners.pageErrors.length > 0
        ? 'FAIL'
        : 'PASS',
      errorCount: listeners.consoleEvents.filter((event) => event.type === 'error').length,
      warningCount: listeners.consoleEvents.filter((event) => event.type === 'warning').length,
      pageErrorCount: listeners.pageErrors.length
    };

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
    interactionResults.filter((interaction) => interaction.status === 'FAIL').forEach((interaction) => {
      result.errors.push({
        type: 'interaction',
        message: `${interaction.id}: ${interaction.error}`,
        url: target.url
      });
    });
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
  executeInteractionRecipe,
  executeInteractionStep,
  waitForPageReady
};
