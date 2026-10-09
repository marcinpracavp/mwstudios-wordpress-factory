const fs = require('fs');
const path = require('path');
const { hash, write } = require('../autopilot/common');
const { settle, compareImages } = require('../autopilot/visual');
const { collectPageMetrics } = require('../qa/capture');

async function layout(page, selectors = {}) {
  return page.evaluate(selectors => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x:r.x + scrollX, y:r.y + scrollY, width:r.width, height:r.height }; };
    const style = el => { const s = getComputedStyle(el); return Object.fromEntries(['display','fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','backgroundImage','maxWidth','marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft','gap','objectFit'].map(k => [k,s[k]])); };
    const elements = selector => Array.from(document.querySelectorAll(selector)).slice(0,500).map(el => ({ tag:el.tagName.toLowerCase(), id:el.id, classes:el.className?.baseVal ?? el.className, ...rect(el), style:style(el) }));
    const images = Array.from(document.images).map(el => ({ src:el.currentSrc || el.src, alt:el.getAttribute('alt'), loaded:el.complete && el.naturalWidth > 0, naturalWidth:el.naturalWidth, naturalHeight:el.naturalHeight, ...rect(el), style:style(el) }));
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(el => ({ level:Number(el.tagName[1]), text:el.textContent.trim(), ...rect(el), style:style(el) }));
    return { title:document.title, lang:document.documentElement.lang, canonical:document.querySelector('link[rel="canonical"]')?.href || null,
      description:document.querySelector('meta[name="description"]')?.content || null, robots:document.querySelector('meta[name="robots"]')?.content || null,
      fonts:Array.from(document.fonts).map(f => ({ family:f.family, weight:f.weight, status:f.status })),
      sections:elements(selectors.sections || 'header,main,footer,section,article,[data-factory-section]'),
      containers:elements(selectors.containers || '.container,[class*="container"],main'),
      typography:elements('body,h1,h2,h3,p,a,button,label'), images, headings,
      accessibilityScreening:{ h1Count:headings.filter(h => h.level===1).length, missingAlt:images.filter(im => im.alt===null).map(im => im.src), langPresent:Boolean(document.documentElement.lang), manualReviewRequired:true }
    };
  }, selectors);
}
async function capture(browser, url, viewport, dir, config) {
  fs.mkdirSync(dir, { recursive:true });
  const result = { url, viewport, capturedAt:new Date().toISOString(), status:'BLOCKED', errors:[], paths:{} };
  let context;
  try {
    context = await browser.newContext({ viewport:{width:viewport.width,height:viewport.height}, deviceScaleFactor:1,
      reducedMotion:'reduce', locale:config.locale || 'pl-PL', timezoneId:'UTC', ignoreHTTPSErrors:config.ignoreHTTPSErrors === true });
    const page = await context.newPage();
    page.setDefaultTimeout(config.timeoutMs || 30000);
    page.on('requestfailed', r => result.errors.push({ type:'request', url:r.url(), message:r.failure()?.errorText }));
    page.on('pageerror', e => result.errors.push({ type:'javascript', message:e.message }));
    const response = await page.goto(url, { waitUntil:'domcontentloaded', timeout:config.timeoutMs || 30000 });
    result.httpStatus = response?.status() ?? null;
    result.finalUrl = page.url();
    result.redirected = result.finalUrl !== url;
    if (!response || response.status() >= 400) throw Error(`HTTP_ACCESS_FAILED: ${result.httpStatus}`);
    await settle(page);
    await page.waitForTimeout(config.settleMs ?? 250);
    result.metrics = await collectPageMetrics(page);
    result.layout = await layout(page, config.selectors);
    await page.screenshot({ path:path.join(dir,'full.png'), fullPage:true, animations:'disabled', timeout:config.timeoutMs || 30000 });
    result.paths.screenshot = 'full.png';
    result.screenshotHash = hash(fs.readFileSync(path.join(dir,'full.png')));
    write(path.join(dir,'layout.json'), result.layout);
    write(path.join(dir,'metrics.json'), result.metrics);
    result.paths.layout = 'layout.json'; result.paths.metrics = 'metrics.json';
    result.status = 'DONE';
  } catch (error) { result.errors.push({ type:'capture', message:error.message }); }
  finally { if (context) await context.close().catch(() => {}); }
  write(path.join(dir,'capture.json'), result);
  return result;
}
async function compare(page, reference, local, dir, visual) {
  for (const record of [reference,local]) {
    if (record.status !== 'DONE') throw Error('CAPTURE_NOT_READY');
    if (hash(fs.readFileSync(record.screenshot)) !== record.screenshotHash) throw Error('CAPTURE_HASH_MISMATCH');
  }
  fs.mkdirSync(dir,{recursive:true});
  const pixels = await compareImages(page, reference.screenshot, local.screenshot, visual, []);
  fs.writeFileSync(path.join(dir,'diff.png'), Buffer.from(pixels.diff.split(',')[1], 'base64'));
  delete pixels.diff;
  const sameSize = pixels.referenceSize.width === pixels.renderedSize.width && Math.abs(pixels.referenceSize.height - pixels.renderedSize.height) <= visual.geometryTolerancePx;
  const result = { status: sameSize && pixels.ratio <= visual.maxDifferentPixelRatio ? 'DONE':'BLOCKED',
    referenceHash:reference.screenshotHash, localHash:local.screenshotHash, thresholds:visual, sameSize, ...pixels, diff:path.join(dir,'diff.png') };
  write(path.join(dir,'comparison.json'),result);
  return result;
}
module.exports = { capture, compare, layout };
