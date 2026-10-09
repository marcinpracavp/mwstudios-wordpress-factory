// Read-only discovery of the complete required register; never substitutes routes.
const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require('../../factory/qa/browser');
const { capture } = require('../../factory/live/capture');
const config = require('../../../docs/projects/collegium-balticum/live.json');

(async () => {
  const run = new Date().toISOString().replace(/[:.]/g, '-');
  const root = `.factory-cache/live/collegium-balticum/discovery/${run}`;
  const records = [];
  const browserInfo = discoverBrowser().browser;
  if (!browserInfo) throw Error('Chromium unavailable');
  const browser = await getChromium().launch({ executablePath: browserInfo.executablePath, headless: true, args: ['--no-sandbox'] });
  try {
    const jobs = config.routes.flatMap(route => config.viewports.filter(v => ['desktop', 'mobile'].includes(v.id)).map(viewport => ({ route, viewport })));
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (jobs.length) {
        const { route, viewport } = jobs.shift();
        const dir = path.join(root, route.id, viewport.id);
        const result = await capture(browser, config.sourceUrl + route.path, viewport, dir, { ...config, timeoutMs: 15000 });
        records.push({ ...result, id: route.id, viewportId: viewport.id, evidence: dir });
        console.log(route.id, viewport.id, result.status, result.errors.find(e => e.type === 'capture')?.message || '');
      }
    }));
  } finally { await browser.close(); }
  records.sort((a, b) => a.id.localeCompare(b.id) || a.viewportId.localeCompare(b.viewportId));
  fs.writeFileSync('docs/projects/collegium-balticum/REFERENCE-ACCESS.json', JSON.stringify({ capturedAt: new Date().toISOString(), timeoutMs: 15000, browser: browserInfo.name, records }, null, 2) + '\n');
  process.exitCode = records.some(r => r.status !== 'DONE') ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
