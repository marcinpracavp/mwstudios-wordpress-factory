const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../../../scripts/factory/live/config');
const { main } = require('../../../scripts/factory/autopilot/run');
test('CB keeps exactly all mandatory CB-00–CB-18 paths from the brief register', async () => {
  const file = path.join(__dirname,'live.json');
  const { config } = loadConfig(file);
  const document = fs.readFileSync(path.join(__dirname,'PAGES.md'),'utf8');
  // PAGES also contains the current status matrix; only the source-URL
  // register has an HTTPS URL in its third column.
  const required = document.split('\n').filter(l => /^\| CB-\d\d \|/.test(l))
    .map(l => l.split('|').map(v=>v.trim()))
    .filter(cells => cells[3].startsWith('https://')).map(cells => {
    return {id:cells[1],path:new URL(cells[3]).pathname};
  });
  assert.equal(required.length,19);
  assert.deepEqual(config.routes.map(r=>({id:r.id,path:r.path})),required);
  assert.deepEqual(config.routes.map(r=>r.id),Array.from({length:19},(_,i)=>`CB-${String(i).padStart(2,'0')}`));
  assert.ok(config.viewports.some(v=>v.width===320));
  assert.ok(config.viewports.some(v=>v.width===2048));
  await main(['live','validate','--config',file]);
});
