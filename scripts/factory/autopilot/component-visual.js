// Source-backed local component acceptance before complete pages exist.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, inside, read, write, hash, fingerprint } = require('./common');
const { discoverBrowser, getChromium } = require('../qa/browser');
const rel = f => path.relative(ROOT, f).replaceAll('\\', '/');
async function compare(page, reference, rendered, box, tolerance) {
  return page.evaluate(async ({ reference, rendered, box, tolerance }) => {
    const load = async src => { const image = new Image(); image.src = src; await image.decode(); return image; };
    const a = await load(reference), b = await load(rendered);
    const width = Math.round(box.width), height = Math.round(box.height);
    if (width < 1 || height < 1 || box.x < 0 || box.y < 0 || box.x + width > a.width + 1 || box.y + height > a.height + 1) throw Error('INVALID_SOURCE_CROP');
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(a, Math.round(box.x), Math.round(box.y), width, height, 0, 0, width, height);
    const source = canvas.toDataURL('image/png'), x = ctx.getImageData(0, 0, width, height);
    ctx.clearRect(0, 0, width, height); ctx.drawImage(b, 0, 0); // Never resize the implementation to manufacture a match.
    const y = ctx.getImageData(0, 0, width, height), d = ctx.createImageData(width, height);
    let different = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      const bad = Math.max(...[0, 1, 2, 3].map(c => Math.abs(x.data[i + c] - y.data[i + c]))) > tolerance;
      if (bad) different++;
      d.data.set(bad ? [255, 0, 100, 255] : [240, 240, 240, 255], i);
    }
    ctx.putImageData(d, 0, 0);
    return { ratio: different / (width * height), source, diff: canvas.toDataURL('image/png'), sourceViewport: a.width,
      renderedSize: { width: b.width, height: b.height }, width, height };
  }, { reference: `data:image/png;base64,${fs.readFileSync(reference).toString('base64')}`,
    rendered: `data:image/png;base64,${fs.readFileSync(rendered).toString('base64')}`, box, tolerance });
}
async function capture({ route, sections, output, manifest, baseUrl, config, hooks, runtimeOnly = false }) {
  manifest ||= require('./source-geometry').resolveManifest();
  route = typeof route === 'string' ? manifest.routes.find(r => r.id === route) : route;
  if (!route || !Number.isFinite(route.width)) throw Error('SOURCE_VIEWPORT_REQUIRED');
  baseUrl ||= read(path.join(ROOT, 'factory/project.json')).environment.localUrl;
  config ||= read(path.join(ROOT, 'factory/autopilot.json'));
  const url = new URL(route.path, baseUrl);
  if (url.origin !== new URL(baseUrl).origin) throw Error('EXTERNAL_ROUTE_FORBIDDEN');
  fs.mkdirSync(output, { recursive: true });
  const implementationHash = fingerprint();
  const browser = await getChromium().launch({ executablePath: discoverBrowser().browser?.executablePath, headless: true });
  const result = { version: 1, route: route.id, viewport: route.width, scope: runtimeOnly ? 'runtime' : 'component-local',
    placementYDeferredToPageGate: true, implementationHash, sections: [], errors: [], capturedAt: new Date().toISOString() };
  try {
    const page = await browser.newPage({ viewport: { width: route.width, height: 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    page.on('pageerror', e => result.errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') result.errors.push(e.text()); });
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (response?.status() !== 200) result.errors.push(`HTTP ${response?.status()}`);
    hooks ||= require('./visual').loadProjectHooks(path.join(ROOT, 'scripts/factory/project/qa-state.js'));
    if (route.state && typeof hooks.prepare !== 'function') throw Error('STATE_PREPARATION_REQUIRED');
    if (hooks.prepare) await hooks.prepare({ page, route, baseUrl });
    await require('./visual').settle(page);
    const metrics = await require('./visual').metrics(page);
    write(path.join(output, 'metrics.json'), metrics);
    if (metrics.overflow > 1) result.errors.push(`Horizontal overflow ${metrics.overflow}px`);
    if (!metrics.fontsReady) result.errors.push('Fonts not ready');
    const comparer = await browser.newPage();
    for (const id of sections) {
      const sourceSection = manifest.sections.find(s => s.id === id);
      const expected = route.sectionGeometry?.[id] || (sourceSection?.snapshot && read(inside(SNAPSHOT, sourceSection.snapshot)).desktop);
      const matches = metrics.sections.filter(s => s.id === id), actual = matches[0];
      if (!expected || matches.length !== 1) { result.sections.push({ id, passed: false, expected, actual, error: 'SOURCE_OR_UNIQUE_ELEMENT_MISSING' }); continue; }
      const geometryPassed = ['x', 'width', 'height'].every(k => Math.abs(actual[k] - expected[k]) <= config.visual.geometryTolerancePx);
      const rendered = path.join(output, `${id}-rendered.png`);
      if (actual.width <= 0 || actual.height <= 0) { result.sections.push({ id, passed: false, expected, actual, error: 'EMPTY_COMPONENT' }); continue; }
      await page.screenshot({ path: rendered, clip: { x: Math.max(0, actual.x), y: Math.max(0, actual.y), width: actual.width, height: actual.height }, animations: 'disabled' });
      const reference = inside(SNAPSHOT, route.reference);
      const pixels = await compare(comparer, reference, rendered, expected, config.visual.channelTolerance);
      for (const [key, suffix] of [['source', 'reference'], ['diff', 'diff']]) {
        fs.writeFileSync(path.join(output, `${id}-${suffix}.png`), Buffer.from(pixels[key].split(',')[1], 'base64')); delete pixels[key];
      }
      const imagesHealthy = metrics.images.filter(im => im.y >= actual.y && im.y < actual.y + actual.height).every(im => im.loaded);
      result.sections.push({ id, expected, actual, pixels, geometryPassed, imagesHealthy,
        referenceHash: hash(fs.readFileSync(reference)), passed: geometryPassed && imagesHealthy && pixels.sourceViewport === route.width && pixels.ratio <= config.visual.maxDifferentPixelRatio });
    }
    if (implementationHash !== fingerprint()) throw Error('IMPLEMENTATION_CHANGED_DURING_COMPONENT_CAPTURE');
  } catch (e) { result.errors.push(e.message); }
  finally { await browser.close(); }
  result.passed = result.errors.length === 0 && (runtimeOnly || sections.length > 0 && result.sections.length === sections.length && result.sections.every(s => s.passed));
  write(path.join(output, 'comparison.json'), result);
  return { ...result, evidence: rel(path.join(output, 'comparison.json')) };
}
module.exports = { capture, compare };
