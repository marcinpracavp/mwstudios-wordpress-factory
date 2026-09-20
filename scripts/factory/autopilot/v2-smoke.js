// An explicitly synthetic three-view project. Never imports data into WordPress.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const engineRoot = path.resolve(__dirname, '../../..');
async function finalWorker() {
  const {ROOT,read,write,resolveCodex}=require('./common');
  const config=read(path.join(ROOT,'factory/autopilot.json'));
  const task={id:'final-sol-once',type:'final-audit',mode:'pixel-perfect',routes:[],sections:[],files:[],title:'Final visual audit of the isolated three-view fixture'};
  const routing=require('./model-router').routeTask(config,task),dir=path.join(ROOT,'run/002-final-sol');
  require('./task-capsule').create({stage:'final',task,routing,dir,sourceContext:{available:false},instructions:require('./custom-instructions').load(ROOT),
    feedback:'Read final-review-packet.json. Open actual reference and after PNG files with the image viewer. Inspect all three views; shared layout once. This is synthetic test evidence, not real Figma acceptance. Do not edit source. Save final-proof.md stating which images you inspected, actual measured ratios and any issues.'});
  const execution=await require('./run').session({executable:resolveCodex().file,config,stage:'final',task,routing,dir,onChild:()=>{}});
  require('./telemetry').record(path.join(ROOT,'run'),{task:task.id,routing,usage:execution.usage,status:execution.result.status,dir,pricing:config.pricing});
  write(path.join(ROOT,'final-worker-result.json'),execution);
}
async function worker() {
  const { ROOT, read, write, resolveCodex } = require('./common');
  const config = read(path.join(ROOT, 'factory/autopilot.json'));
  const routing = require('./model-router').routeTask(config, { id: 'hero-height', type: 'style-fix' });
  const dir = path.join(ROOT, 'run/001-hero-height');
  const task = { id: 'hero-height', title: 'Correct only the hero height in the synthetic smoke project', type: 'style-fix', sections: ['hero'],
    files: ['src/layout.css'], routes: [read(path.join(ROOT, '.factory-cache/figma/latest/manifest.json')).routes[0]] };
  const metrics = read(path.join(ROOT, 'before/metrics.json'));
  write(path.join(dir, 'source-context/scope.json'), { routes: task.routes, sections: [{ id: 'hero', snapshot: '.factory-cache/figma/latest/hero.json' }] });
  const capsule = require('./task-capsule').create({ stage: 'correct', task, routing, dir, sourceContext: { available: false },
    instructions: require('./custom-instructions').load(ROOT), feedback: 'The hero is 360px high. The test source contract requires exactly 320px. Change only that height. Other declarations must be unchanged.' });
  capsule.measurements = [{ route: 'home', sections: [{ id: 'hero', expected: { height: 320 }, actual: metrics.sections.find(s => s.id === 'hero'), html: metrics.sections.find(s => s.id === 'hero').html }] }];
  write(path.join(dir, 'task-capsule.json'), capsule);
  const before = fs.readFileSync(path.join(ROOT, 'src/layout.css'), 'utf8');
  let result;
  try {
    result = await require('./run').session({ executable: resolveCodex().file, config, stage: 'correct', task, routing, dir, onChild: () => {} });
    const after = fs.readFileSync(path.join(ROOT, 'src/layout.css'), 'utf8');
    if (after === before) throw Error('SMOKE_NO_WORKER_CHANGE');
    if (after.replace('height:320px', 'height:360px').trimEnd() !== before.trimEnd()) throw Error('SMOKE_UNEXPECTED_WORKER_CHANGE');
    require('./telemetry').record(path.join(ROOT, 'run'), { task: task.id, routing, usage: result.usage, status: 'awaiting-measurement', dir,pricing:config.pricing });
    write(path.join(ROOT, 'worker-result.json'), { model: 'luna', status: result.result.status, usage: result.usage, capsuleBytes: fs.statSync(path.join(dir, 'task-capsule.json')).size });
  } catch (e) { write(path.join(ROOT, 'worker-failure.json'), { error: e.message, execution: e.execution || null }); throw e; }
}
async function smoke() {
  const { write } = require('./common');
  const root = path.join(engineRoot, '.factory-cache/v2-smoke', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  const css = 'html,body{margin:0;font-family:Arial}header{height:64px;background:#123;color:white}main{height:360px;background:#eef}footer{height:40px;background:#abc}button{height:32px}.panel{display:none;height:80px}.open .panel{display:block}';
  fs.writeFileSync(path.join(root, 'src/layout.css'), css);
  const pageHtml = active => `<!doctype html><html><head><link rel="icon" href="data:,"><link rel="stylesheet" href="/layout.css"></head><body><header data-factory-section="shared-header">Shared test header</header><main data-factory-section="hero"><h1 style="margin:0">Synthetic smoke fixture</h1><button onclick="document.body.classList.toggle('open')">Open</button><div class="panel">Source active content</div></main><footer data-factory-section="shared-footer">Shared test footer</footer>${active ? '<script>document.body.classList.add("open")</script>' : ''}</body></html>`;
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/layout.css' ? 'text/css' : 'text/html');
    res.end(req.url === '/layout.css' ? fs.readFileSync(path.join(root, 'src/layout.css')) : pageHtml(req.url === '/active'));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const config = { ...require(path.join(engineRoot, 'factory/autopilot.json')), stageTimeoutMinutes: 12,
    taskBudgets: { maxInputTokens: 600000, maxUncachedInputTokens: 60000, maxOutputTokens: 6000, maxAttempts: 3, maxPromptBytes: 14000 } };
  write(path.join(root, 'factory/autopilot.json'), config);
  write(path.join(root, 'factory/project.json'), { project: { name: 'Synthetic V2 smoke' }, environment: { localUrl: baseUrl }, wordpress: { languages: ['en'] } });
  write(path.join(root, 'custom-instructions.json'), { all: 'ISOLATED SYNTHETIC TEST. Modify only src/layout.css inside this fixture. No WordPress, Figma calls, parent theme changes or npm install. The only required change is hero height:360px to height:320px; preserve every other byte. Save proof to proof.md and include CUSTOM_SMOKE_OBSERVED in proof.md. npm run build is a local syntax check. Do not touch any parent project.' });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Isolated synthetic Autopilot test\nOnly this fixture may be modified. No real site work.\n');
  write(path.join(root, 'package.json'), { name: 'factory-v2-synthetic-smoke', private: true, scripts: { build: 'node -e "require(\'fs\').readFileSync(\'src/layout.css\')"' } });
  fs.mkdirSync(path.join(root, 'factory/schemas'), { recursive: true });
  fs.copyFileSync(path.join(engineRoot, 'factory/schemas/autopilot-result.schema.json'), path.join(root, 'factory/schemas/autopilot-result.schema.json'));
  const manifest = { routes: ['home', 'about', 'active'].map((id, i) => ({ id, path: i ? '/' + id : '/', width: 1920, height: 424, reference: `${id}.png`, sections: ['shared-header', 'hero', 'shared-footer'],
    sectionGeometry: { 'shared-header': { x: 0, y: 0, width: 1920, height: 64 }, hero: { x: 0, y: 64, width: 1920, height: 320 }, 'shared-footer': { x: 0, y: 384, width: 1920, height: 40 } } })),
    sections: ['shared-header', 'hero', 'shared-footer'].map(id => ({ id, snapshot: `${id}.json` })) };
  write(path.join(root, '.factory-cache/figma/latest/manifest.json'), manifest);
  for (const section of manifest.sections) write(path.join(root, '.factory-cache/figma/latest', section.snapshot), { id: section.id, desktop: manifest.routes[0].sectionGeometry[section.id], fixture: true });
  const { discoverBrowser, getChromium } = require('../qa/browser');
  const browser = await getChromium().launch({ executablePath: discoverBrowser().browser.executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 900 }, deviceScaleFactor: 1 });
    for (const route of manifest.routes) {
      await page.goto(baseUrl + route.path); await require('./visual').settle(page);
      await page.addStyleTag({ content: 'main{height:320px}' });
      await page.screenshot({ path: path.join(root, '.factory-cache/figma/latest', route.reference), fullPage: true });
    }
    await page.goto(baseUrl); await require('./visual').settle(page);
    write(path.join(root, 'before/metrics.json'), await require('./visual').metrics(page));
    await page.screenshot({ path: path.join(root, 'before/rendered.png'), fullPage: true });
    const negative = await require('./component-visual').compare(page, path.join(root, '.factory-cache/figma/latest/home.png'), path.join(root, 'before/rendered.png'), { x: 0, y: 0, width: 1920, height: 900 }, 24);
    const child = spawn(process.execPath, [__filename, '--worker'], { cwd: root, env: { ...process.env, FACTORY_AUTOPILOT_ROOT: root }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(fs.createWriteStream(path.join(root, 'worker.out.log'))); child.stderr.pipe(fs.createWriteStream(path.join(root, 'worker.err.log')));
    const code = await new Promise(resolve => child.on('close', resolve));
    if (code !== 0) throw Error(`SMOKE_WORKER_FAILED: ${root}`);
    if (!fs.readFileSync(path.join(root, 'proof.md'), 'utf8').includes('CUSTOM_SMOKE_OBSERVED')) throw Error('CUSTOM_INSTRUCTION_NOT_OBSERVED');
    const checks = [];
    for (const route of manifest.routes) {
      await page.goto(baseUrl + route.path); await require('./visual').settle(page);
      const actual = await require('./visual').metrics(page), render = path.join(root, `${route.id}-after.png`);
      await page.screenshot({ path: render, fullPage: true });
      const pixels = await require('./component-visual').compare(page, path.join(root, '.factory-cache/figma/latest', route.reference), render, { x: 0, y: 0, width: 1920, height: 900 }, 24);
      if (pixels.ratio !== 0 || actual.sections.find(s => s.id === 'hero').height !== 320 || actual.overflow > 0) throw Error(`SMOKE_VISUAL_FAILURE: ${route.id}`);
      checks.push({ route: route.id, width: 1920, ratio: pixels.ratio, heroHeight: 320, overflow: actual.overflow });
    }
    await page.goto(baseUrl); await page.getByRole('button', { name: 'Open', exact: true }).click();
    if (!await page.locator('.panel').isVisible()) throw Error('SMOKE_INTERACTION_FAILED');
    const usage = JSON.parse(fs.readFileSync(path.join(root, 'worker-result.json')));
    require('./telemetry').record(path.join(root, 'run'), { task: 'hero-height', routing: require('./model-router').routeTask(config, { type: 'style-fix' }),
      usage: usage.usage, status: 'pass', dir: path.join(root, 'run/001-hero-height'),pricing:config.pricing });
    const legacy = require('child_process').spawnSync('git', ['show', 'autopilot-v1:scripts/factory/autopilot/prompts.js'], { cwd: engineRoot, encoding: 'utf8', windowsHide: true });
    const oldCommon = legacy.stdout.slice(legacy.stdout.indexOf('const common'), legacy.stdout.indexOf('const stages'));
    const currentCommon = require('./prompt-topics').common('style-fix');
    const summary=()=>({passed:true,sourceHash:'synthetic-three-view-v1',routes:checks.map(c=>({id:c.route,ownership:{page:{pixels:1920*900,ratio:c.ratio}}}))});
    write(path.join(root,'interaction-proof.json'),{passed:true,action:'Clicked the real Open button on the canonical route',observed:'Panel became visible',nativeIntegration:'Not applicable: isolated synthetic static fixture'});
    write(path.join(root,'final-review-packet.json'),{fixture:'Explicit synthetic test, not a production Figma design',checks,negativeControlRatio:negative.ratio,
      interactionEvidence:'interaction-proof.json',nativeIntegration:'not applicable',
      images:manifest.routes.map(r=>({route:r.id,reference:`.factory-cache/figma/latest/${r.reference}`,rendered:`${r.id}-after.png`}))});
    await require('./final-audit').run({dir:path.join(root,'run'),comparison:summary(),
      invoke:async()=>{
        const finalChild=spawn(process.execPath,[__filename,'--final-worker'],{cwd:root,env:{...process.env,FACTORY_AUTOPILOT_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});
        finalChild.stdout.pipe(fs.createWriteStream(path.join(root,'final.out.log')));finalChild.stderr.pipe(fs.createWriteStream(path.join(root,'final.err.log')));
        if(await new Promise(resolve=>finalChild.on('close',resolve))!==0)throw Error(`SMOKE_FINAL_SOL_FAILED: ${root}`);
        return JSON.parse(fs.readFileSync(path.join(root,'final-worker-result.json'))).result;
      },repair:async()=>{throw Error('SMOKE_FINAL_FOUND_REGRESSION: retain Sol findings');},
      build:async()=>require('./smoke-webpack').build(root),
      capture:async()=>{
        for(const r of manifest.routes){await page.goto(baseUrl+r.path);await require('./visual').settle(page);const out=path.join(root,`${r.id}-final.png`);await page.screenshot({path:out,fullPage:true});
          const p=await require('./component-visual').compare(page,path.join(root,'.factory-cache/figma/latest',r.reference),out,{x:0,y:0,width:1920,height:900},24);
          if(p.ratio!==0)throw Error('SMOKE_FINAL_RECAPTURE_FAILED');}
        return summary();
      }});
    const finalExecution=JSON.parse(fs.readFileSync(path.join(root,'final-worker-result.json')));
    const webpack=await require('./smoke-webpack').verify(root);
    const report = { status: 'complete', readiness:'READY FOR HUMAN REVIEW', fixture: 'synthetic, not a Figma/WordPress production acceptance', model: 'luna', finalModel:'sol',webpack,finalUsage:finalExecution.usage,negativeControlRatio: negative.ratio, checks,
      interactionPassed: true, customInstructionObserved: true, usage, promptComparison: { metric: 'common prompt characters (not actual billed tokens)', v1: oldCommon.length, v2: currentCommon.length,
        reduction: oldCommon.length ? 1 - currentCommon.length / oldCommon.length : null } };
    write(path.join(root, 'REPORT.json'), report);
    console.log(JSON.stringify({ root, ...report }, null, 2));
  } finally { await browser.close(); server.close(); }
}
if (require.main === module) (process.argv.includes('--final-worker') ? finalWorker() : process.argv.includes('--worker') ? worker() : smoke()).catch(e => { console.error(e.message); process.exitCode = 1; });
