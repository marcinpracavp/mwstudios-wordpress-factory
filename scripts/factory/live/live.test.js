const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { loadConfig, select, url, checks } = require('./config');
const { fresh, record, registry, options, main } = require('./run');
const { capture, compare } = require('./capture');
const { discoverBrowser, getChromium } = require('../qa/browser');
const { hash, fingerprint } = require('../autopilot/common');
const example = require('./example.json');
function configFile(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'live-config-'));
  const file = path.join(dir,'config.json'); fs.writeFileSync(file,JSON.stringify(config));
  return {file, cleanup:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
test('LIVE validates explicit source, URLs, complete matrix and output isolation', () => {
  const fixture = configFile(example);
  try {
    assert.equal(loadConfig(fixture.file).config.source,'live');
    for (const overrides of [{source:'figma'}, {localUrl:null}, {sourceUrl:'https://user:pass@example.com'}, {reportDir:'.'},
      {routes:[{id:'x',path:'//evil.test/'}]}, {routes:[{id:'x',path:'/a/../b/'}]},
      {routes:[{id:'x',path:'/'},{id:'x',path:'/a/'}]}, {viewports:[]}]) {
      fs.writeFileSync(fixture.file,JSON.stringify({...example,...overrides}));
      assert.throws(()=>loadConfig(fixture.file));
    }
    assert.throws(()=>loadConfig());
    assert.throws(()=>select(example.routes,'typo','ROUTE'));
    assert.equal(url('https://example.com/subdir','/child/'),'https://example.com/subdir/child/');
    assert.throws(()=>options(['run','--unknown','x']));
  } finally { fixture.cleanup(); }
});
test('batch filtering retains all routes and all six statuses; template does not imply content', () => {
  const config = {...example,routes:[{id:'one',path:'/'},{id:'two',path:'/two/'}]};
  const state = fresh(config,'test');
  record(state,config.routes[0],config.viewports[0]).reference={status:'DONE',screenshot:__filename,screenshotHash:hash(fs.readFileSync(__filename))};
  const rows = registry(config,state);
  assert.equal(rows.length,2);
  assert.equal(rows[0].statuses.referenceCapture,'IN_PROGRESS');
  assert.equal(rows[1].statuses.referenceCapture,'TODO');
  assert.deepEqual(Object.keys(rows[0].statuses),checks);
  assert.equal(rows[0].statuses.content,'TODO');
  assert.equal(rows[0].ready,false);
});
test('browser capture, layout, unequal image diff, errors, repeat and frozen reference', async () => {
  const found = discoverBrowser();
  assert.ok(found.browser,'Install Chromium before running integration tests');
  const browser = await getChromium().launch({executablePath:found.browser.executablePath,headless:true});
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'live-browser-'));
  const server = http.createServer((req,res) => {
    if (req.url==='/missing/') { res.writeHead(404); res.end('missing'); return; }
    if (req.url==='/redirect/') { res.writeHead(302,{Location:'/'}); res.end(); return; }
    const changed=req.url==='/changed/';
    res.end(`<html lang="en"><title>Fixture</title><style>body{background:${changed?'blue':'white'}}main{max-width:800px;padding:30px}section{height:${changed?500:300}px}</style><main class="container"><h1>Fixture</h1><section><p>Text</p><img alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3C/svg%3E"></section></main></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const viewport={id:'desktop',width:800,height:300};
  const cfg={...example,sourceUrl:base,localUrl:base,viewports:[viewport],reportDir:`.factory-cache/live/test-${process.pid}`};
  const fixture=configFile(cfg);
  const statePath=path.resolve(cfg.reportDir,'state.json');
  try {
    const ref=await capture(browser,base+'/',viewport,path.join(dir,'ref'),cfg);
    const local=await capture(browser,base+'/',viewport,path.join(dir,'local'),cfg);
    assert.equal(ref.status,'DONE'); assert.ok(fs.existsSync(path.join(dir,'ref/full.png')));
    assert.equal(ref.layout.headings[0].text,'Fixture'); assert.ok(ref.layout.sections.length); assert.ok(ref.layout.containers.length);
    const pointer=(r,folder)=>({...r,screenshot:path.join(dir,folder,'full.png')});
    const page=await browser.newPage();
    const same=await compare(page,pointer(ref,'ref'),pointer(local,'local'),path.join(dir,'same'),cfg.visual);
    assert.equal(same.ratio,0); assert.equal(same.status,'DONE');
    const changed=await capture(browser,base+'/changed/',viewport,path.join(dir,'changed'),cfg);
    const diff=await compare(page,pointer(ref,'ref'),pointer(changed,'changed'),path.join(dir,'diff'),cfg.visual);
    assert.equal(diff.status,'BLOCKED'); assert.ok(diff.ratio>0); assert.equal(diff.sameSize,false); assert.ok(fs.statSync(diff.diff).size>0);
    const missing=await capture(browser,base+'/missing/',viewport,path.join(dir,'missing'),cfg);
    assert.equal(missing.status,'BLOCKED'); assert.equal(missing.httpStatus,404); assert.equal(missing.paths.screenshot,undefined);
    const redirected=await capture(browser,base+'/redirect/',viewport,path.join(dir,'redirect'),cfg);
    assert.equal(redirected.redirected,true); assert.equal(redirected.finalUrl,base+'/');
    const bad=await capture(browser,'http://127.0.0.1:1/',viewport,path.join(dir,'bad'),cfg);
    assert.equal(bad.status,'BLOCKED');
    const brokenScreenshotBrowser = { async newContext(settings) {
      const context = await browser.newContext(settings);
      const newPage = context.newPage.bind(context);
      context.newPage = async () => {
        const page = await newPage();
        page.screenshot = async () => { throw Error('SCREENSHOT_WRITE_FAILED'); };
        return page;
      };
      return context;
    } };
    const failedScreenshot = await capture(brokenScreenshotBrowser,base+'/',viewport,path.join(dir,'failed-screenshot'),cfg);
    assert.equal(failedScreenshot.status,'BLOCKED');
    assert.equal(failedScreenshot.paths.screenshot,undefined);
    assert.match(failedScreenshot.errors.at(-1).message,/SCREENSHOT_WRITE_FAILED/);
    const beforeExit=process.exitCode;
    await main(['run','--config',fixture.file]);
    const first=JSON.parse(fs.readFileSync(statePath));
    await main(['run','--config',fixture.file]);
    const second=JSON.parse(fs.readFileSync(statePath));
    assert.equal(first.records['home/desktop'].reference.screenshot,second.records['home/desktop'].reference.screenshot);
    assert.notEqual(first.records['home/desktop'].local.screenshot,second.records['home/desktop'].local.screenshot);
    assert.equal(second.runs.length,2); assert.equal(registry(cfg,second)[0].ready,false);
    second.records['home/desktop'].local.implementationHash = 'stale';
    assert.equal(registry(cfg,second)[0].statuses.visualQA,'BLOCKED');
    assert.equal(registry(cfg,second)[0].statuses.localPage,'BLOCKED');
    const manual=path.join(dir,'review.md');fs.writeFileSync(manual,'Verified template at actual local page');
    await main(['review','--config',fixture.file,'--route','home','--check','template','--evidence',manual]);
    const reviewed=JSON.parse(fs.readFileSync(statePath));
    assert.equal(registry(cfg,reviewed)[0].statuses.template,'DONE');
    assert.equal(registry(cfg,reviewed)[0].statuses.content,'TODO');
    fs.writeFileSync(manual,'Changed evidence');
    assert.equal(registry(cfg,reviewed)[0].statuses.template,'IN_PROGRESS');
    fs.appendFileSync(pointer(ref,'ref').screenshot,'tamper');
    await assert.rejects(compare(page,pointer(ref,'ref'),pointer(local,'local'),dir,cfg.visual),/HASH_MISMATCH/);
    process.exitCode=beforeExit;
  } finally {
    await browser.close(); await new Promise(resolve=>server.close(resolve)); fixture.cleanup();
    fs.rmSync(dir,{recursive:true,force:true});fs.rmSync(path.resolve(cfg.reportDir),{recursive:true,force:true});
  }
});
