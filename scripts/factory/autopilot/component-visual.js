// Source-backed local component acceptance before complete pages exist.
const fs = require('fs');
const path = require('path');
const { resolveLocalUrl, ROOT, SNAPSHOT, inside, read, write, hash, fingerprint } = require('./common');
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
function isInvalidSourceCrop(error) {
  return error?.message === 'INVALID_SOURCE_CROP';
}
async function capture({ route, sections, output, manifest, baseUrl, config, hooks, runtimeOnly = false }) {
  manifest ||= require('./source-geometry').resolveManifest();
  route = typeof route === 'string' ? manifest.routes.find(r => r.id === route) : route;
  if (!route || !Number.isFinite(route.width)) throw Error('SOURCE_VIEWPORT_REQUIRED');
  baseUrl ||= resolveLocalUrl(read(path.join(ROOT, 'factory/project.json')));
  config ||= read(path.join(ROOT, 'factory/autopilot.json'));
  // The source manifest describes canonical paths, while a fresh WordPress
  // install may still use query-string permalinks and have no posts page.
  // Provision/resolve that native route before opening the browser so a 404
  // never burns an expensive component-model attempt.
  const routeReadiness = require('./route-readiness').prepare(route);
  route = { ...route, path: routeReadiness.path || route.path };
  const url = new URL(route.path, baseUrl);
  if (url.origin !== new URL(baseUrl).origin) throw Error('EXTERNAL_ROUTE_FORBIDDEN');
  fs.mkdirSync(output, { recursive: true });
  const implementationHash = fingerprint();
  const browser = await getChromium().launch({ executablePath: discoverBrowser().browser?.executablePath, headless: true });
  const result = { version: 1, route: route.id, routeReadiness, viewport: route.width, scope: runtimeOnly ? 'runtime' : 'component-local',
    placementYDeferredToPageGate: true, implementationHash, sections: [], errors: [], capturedAt: new Date().toISOString() };
  try {
    const page = await browser.newPage({ viewport: { width: route.width, height: 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    page.on('pageerror', e => result.errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') result.errors.push(e.text()); });
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (response?.status() !== 200) throw Error(`ROUTE_HTTP_${response?.status()}`);
    hooks ||= require('./visual').loadProjectHooks(path.join(ROOT, 'scripts/factory/project/qa-state.js'));
    if (route.state && typeof hooks.prepare !== 'function') throw Error('STATE_PREPARATION_REQUIRED');
    if (hooks.prepare) await hooks.prepare({ page, route, baseUrl });
    await require('./visual').settle(page);
    const metrics = await require('./visual').metrics(page);
    await require('./image-noise').verifySources(page,metrics.images,baseUrl);
    write(path.join(output, 'metrics.json'), metrics);
    const semantic = require('./semantic-coverage').inspect(manifest, route, metrics, sections);
    if (metrics.overflow > 1) result.errors.push(`Horizontal overflow ${metrics.overflow}px`);
    if (!metrics.fontsReady) result.errors.push('Fonts not ready');
    const comparer = await browser.newPage();
    for (const id of sections) {
      const sourceSection = manifest.sections.find(s => s.id === id);
      const expected = route.sectionGeometry?.[id] || (sourceSection?.snapshot && read(inside(SNAPSHOT, sourceSection.snapshot)).desktop);
      // Nested reusable cards can carry the same marker as their owning
      // section. They are not independent section roots and must not make a
      // component capture appear ambiguous.
      const matches = metrics.sections.filter(s => s.id === id && s.parentSection !== id), actual = matches[0];
      if (!expected || matches.length !== 1) { result.sections.push({ id, passed: false, expected, actual, error: 'SOURCE_OR_UNIQUE_ELEMENT_MISSING' }); continue; }
      const geometryPassed = ['x', 'width', 'height'].every(k => Math.abs(actual[k] - expected[k]) <= config.visual.geometryTolerancePx);
      const rendered = path.join(output, `${id}-rendered.png`);
      if (actual.width <= 0 || actual.height <= 0) { result.sections.push({ id, passed: false, expected, actual, error: 'EMPTY_COMPONENT' }); continue; }
      // Capture the component itself rather than a document clip. A fixed
      // viewport can truncate sections placed below the fold and create a
      // false pixel mismatch even when the local component is correct.
      // DOM order puts the section root before any nested reusable children.
      // It matches the outer candidate selected above when child markup has
      // inherited the same data-factory-section value.
      await page.locator(`[data-factory-section="${id}"]`).first().screenshot({ path: rendered, animations: 'disabled' });
      const reference = inside(SNAPSHOT, route.reference);
      let pixels;
      let pixelComparisonDeferred = false;
      try {
        pixels = await compare(comparer, reference, rendered, expected, config.visual.channelTolerance);
        for (const [key, suffix] of [['source', 'reference'], ['diff', 'diff']]) {
          fs.writeFileSync(path.join(output, `${id}-${suffix}.png`), Buffer.from(pixels[key].split(',')[1], 'base64')); delete pixels[key];
        }
      } catch (error) {
        // A stale/out-of-frame source box cannot be repaired by changing the
        // component. Keep semantic and runtime validation authoritative, and
        // retain the missing visual comparison for the full-page source QA.
        if (!isInvalidSourceCrop(error)) throw error;
        pixels = { sourceViewport: route.width, comparisonDeferred: 'INVALID_SOURCE_CROP' };
        pixelComparisonDeferred = true;
      }
      const localImages=metrics.images.filter(im=>im.sourceIdentityVerified&&im.x>=actual.x&&im.y>=actual.y&&im.x+im.width<=actual.x+actual.width&&im.y+im.height<=actual.y+actual.height)
        .map(im=>({...im,x:im.x-actual.x,y:im.y-actual.y}));
      if(!pixelComparisonDeferred && geometryPassed && localImages.length){
        const details=await require('./visual').compareImages(comparer,path.join(output,`${id}-reference.png`),rendered,config.visual,[],localImages);
        pixels.layoutRatio=details.ownership.page.layoutRatio;pixels.imageDiagnostics=details.imageDiagnostics;
      }
      const imagesHealthy = metrics.images.filter(im => im.y >= actual.y && im.y < actual.y + actual.height).every(im => im.loaded);
      const semanticSection = semantic.sections.find(section => section.id === id);
      result.sections.push({ id, expected, actual, pixels, geometryPassed, imagesHealthy, semantic: semanticSection,
        pixelComparisonDeferred, referenceHash: hash(fs.readFileSync(reference)),
        passed: geometryPassed && imagesHealthy && semanticSection?.passed !== false && pixels.sourceViewport === route.width
          && (pixelComparisonDeferred || (pixels.layoutRatio??pixels.ratio) <= config.visual.maxDifferentPixelRatio) });
    }
    result.semantic = semantic;
    for (const section of semantic.sections.filter(section => !section.passed)) result.errors.push(`SEMANTIC_SECTION_INCOMPLETE ${section.id}: missing source nodes ${section.missingSourceNodes.join(',')}`);
    for (const section of semantic.unregisteredSections) result.errors.push(`UNREGISTERED_SECTION ${section.id}: visible top-level section is absent from route blueprint`);
    if (implementationHash !== fingerprint()) throw Error('IMPLEMENTATION_CHANGED_DURING_COMPONENT_CAPTURE');
  } catch (e) { result.errors.push(e.message); }
  finally { await browser.close(); }
  result.passed = result.errors.length === 0 && (runtimeOnly || sections.length > 0 && result.sections.length === sections.length && result.sections.every(s => s.passed));
  write(path.join(output, 'comparison.json'), result);
  return { ...result, evidence: rel(path.join(output, 'comparison.json')) };
}
module.exports = { capture, compare, isInvalidSourceCrop };
