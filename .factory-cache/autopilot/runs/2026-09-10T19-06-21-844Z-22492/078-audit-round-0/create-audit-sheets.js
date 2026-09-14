const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../../../../scripts/factory/qa/browser');

const themeRoot = path.resolve(__dirname, '../../../../..');
const comparisonRoot = path.join(themeRoot, '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/comparison-1789318767631');
const snapshotRoot = path.join(themeRoot, '.factory-cache/figma/latest');
const outputRoot = path.join(__dirname, 'visual-sheets');
const summary = JSON.parse(fs.readFileSync(path.join(comparisonRoot, 'summary.json'), 'utf8'));

function fileUrl(filePath) {
  return `file:///${filePath.replace(/\\/g, '/')}`;
}

function esc(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' })[char]);
}

function resolveReference(relativePath) {
  return path.join(snapshotRoot, relativePath.replace(/\//g, path.sep));
}

function imageCell(label, imagePath) {
  const exists = imagePath && fs.existsSync(imagePath);
  return `<figure><figcaption>${esc(label)}${exists ? '' : ' — MISSING'}</figcaption>${exists ? `<img src="${fileUrl(imagePath)}">` : '<div class="missing">missing</div>'}</figure>`;
}

function shell(title, body, css = '') {
  return `<!doctype html><meta charset="utf-8"><style>
  *{box-sizing:border-box} body{margin:0;padding:20px;background:#222;color:#fff;font:14px Arial,sans-serif}
  h1,h2{margin:0 0 14px} h2{padding-top:18px;border-top:2px solid #777}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;margin-bottom:28px}
  figure{margin:0;background:#444;padding:8px;min-width:0} figcaption{font-weight:700;margin-bottom:6px;overflow-wrap:anywhere}
  img{display:block;width:100%;height:auto;background:#fff}.missing{height:120px;display:grid;place-items:center;background:#700}
  ${css}</style><h1>${esc(title)}</h1>${body}`;
}

async function screenshot(browser, name, html, viewport = { width: 1500, height: 1000 }) {
  const htmlPath = path.join(outputRoot, `${name}.html`);
  const pngPath = path.join(outputRoot, `${name}.png`);
  fs.writeFileSync(htmlPath, html);
  const page = await browser.newPage({ viewport });
  await page.goto(fileUrl(htmlPath), { waitUntil: 'load' });
  await page.screenshot({ path: pngPath, fullPage: true });
  await page.close();
}

(async () => {
  fs.mkdirSync(outputRoot, { recursive: true });
  const discovery = discoverBrowser();
  if (!discovery.browser) throw new Error('No supported browser found');
  const browser = await getChromium().launch({ executablePath: discovery.browser.executablePath, headless: true });
  try {
    for (const routeSummary of summary.routes) {
      const route = routeSummary.id;
      const dir = path.join(comparisonRoot, route);
      const comparison = JSON.parse(fs.readFileSync(path.join(dir, 'comparison.json'), 'utf8'));
      const fullBody = `<div class="grid">${imageCell(`reference ${comparison.reference.width}x${comparison.reference.height}`, resolveReference(comparison.reference.path))}${imageCell(`rendered ${comparison.rendered.width}x${comparison.rendered.height}`, path.join(dir, 'rendered.png'))}${imageCell(`diff ${(comparison.pixels.ratio * 100).toFixed(3)}%`, path.join(dir, 'diff.png'))}</div>`;
      await screenshot(browser, `full-${route}`, shell(`FULL — ${route}`, fullBody));

      const cropRows = comparison.pixels.crops.map((crop) => {
        const geometry = comparison.geometry.find((item) => item.id === crop.id);
        const delta = geometry && geometry.delta ? ` Δx/y/w/h=${geometry.delta.x}/${geometry.delta.y}/${geometry.delta.width}/${geometry.delta.height}` : '';
        const heading = `<h2>${esc(crop.id)} — ${(crop.ratio * 100).toFixed(3)}%${esc(delta)}</h2>`;
        const cells = imageCell('reference', path.join(dir, `${crop.id}-reference.png`)) + imageCell('rendered', path.join(dir, `${crop.id}-rendered.png`)) + imageCell('diff', path.join(dir, `${crop.id}-diff.png`));
        return `${heading}<div class="grid">${cells}</div>`;
      }).join('');
      await screenshot(browser, `sections-${route}`, shell(`SECTIONS — ${route}`, cropRows));

      const responsiveCells = comparison.responsive.map((item) => imageCell(`${item.width}px — ${item.renderHealthy ? 'healthy' : 'UNHEALTHY'}`, path.join(themeRoot, item.screenshot))).join('');
      await screenshot(browser, `responsive-${route}`, shell(`RESPONSIVE — ${route}`, `<div class="responsive">${responsiveCells}</div>`, '.responsive{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-items:start}.responsive figure{padding:5px}.responsive img{max-height:1400px;object-fit:contain;object-position:top}'));
    }
  } finally {
    await browser.close();
  }
  process.stdout.write(`Created ${summary.routes.length * 3} audit sheets in ${path.relative(themeRoot, outputRoot)}\n`);
})().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
