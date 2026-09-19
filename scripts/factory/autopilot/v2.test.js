const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { routeTask, MODELS } = require('./model-router');
const { diagnose } = require('./diagnostics');
const { common } = require('./prompt-topics');
const custom = require('./custom-instructions');
const progress = require('./task-progress');
const { entry } = require('./telemetry');
const config = { taskBudgets: { maxInputTokens: 100000, maxOutputTokens: 10000, maxAttempts: 4, maxPromptBytes: 16000 } };
const done = (model, status) => ({ model: MODELS[model], status, result: { status }, usage: { input_tokens: 100, output_tokens: 20 } });
test('Luna takes CSS/PHP work on medium, complex tasks on high, no stage lookup', () => {
  assert.equal(routeTask(config, { stage: 'audit', files: ['src/a.scss'] }).alias, 'luna');
  assert.equal(routeTask(config, { files: ['src/a.scss'] }).reasoningEffort, 'medium');
  assert.equal(routeTask(config, { type: 'refactor' }).reasoningEffort, 'high');
  assert.equal(routeTask(config, { type: 'style-fix' }, [done('luna', 'needs_work')]).alias, 'terra');
  assert.equal(routeTask(config, { type: 'style-fix' }, [done('luna', 'needs_work'), done('terra', 'needs_work')]).alias, 'luna');
});
test('Sol is restricted to final polish; cheaper successful work does not require Terra', () => {
  assert.equal(routeTask(config, { type: 'final-polish' }).alias, 'luna');
  assert.equal(routeTask(config, { type: 'final-polish' }, [done('luna', 'passed')]).alias, 'sol');
  assert.equal(routeTask(config, { type: 'final-polish' }, [done('luna', 'needs_work')]).alias, 'terra');
  assert.equal(routeTask(config, { type: 'final-polish' }, [done('luna', 'needs_work'), done('terra', 'needs_work')]).alias, 'luna');
  assert.equal(routeTask(config, { type: 'final-polish' }, [done('luna', 'needs_work'), done('terra', 'needs_work'), done('luna', 'needs_work')]).alias, 'sol');
});
test('capacity interruption does not escalate and attempts/budgets survive resume', () => {
  const interrupted = { model: MODELS.luna, status: 'failed', error: 'AGENT_EXECUTION_FAILED: capacity limit' };
  assert.equal(routeTask(config, { type: 'refactor' }, [interrupted]).alias, 'luna');
  assert.equal(routeTask(config, { id: 'x' }, Array(4).fill(interrupted)).alias, 'luna');
  assert.throws(() => routeTask(config, { id: 'x' }, Array(4).fill(done('terra', 'needs_work'))), /TASK_ATTEMPTS/);
  assert.throws(() => routeTask(config, { id: 'x' }, [{ ...interrupted, usage: { input_tokens: 100000 } }]), /TASK_TOKEN_BUDGET/);
});
test('CSS prompt has no payments, ACF or commerce instructions', () => {
  assert.doesNotMatch(common('style-fix'), /ACF|WooCommerce|payments|variation/i);
  assert.match(common('native-content'), /categories|category/);
  assert.ok(common('style-fix').length < common('source-extraction').length);
});
test('global diagnosis requires identical errors across all routes; local height stays section scoped', () => {
  const rows = [1, 2, 3].map(id => ({ id: String(id), errors: ['Horizontal overflow 50px'] }));
  assert.equal(diagnose(rows)[0].global, true);
  rows[2].errors = ['HTTP 500'];
  assert.equal(diagnose(rows).some(x => x.global), false);
  const result = diagnose([{ id: 'home', errors: [], geometry: [{ id: 'hero', owner: 'page', passed: false, actual: { height: 450 }, expected: { height: 400 }, delta: { height: 50 } }] }]);
  assert.deepEqual(result[0].sections, ['hero']); assert.equal(result[0].reason, 'Section height differs');
});
test('custom instructions, task-specific selection, raw-byte binding and invalid JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-v2-custom-'));
  try {
    fs.writeFileSync(path.join(dir, 'custom-instructions.json'), JSON.stringify({ all: 'TEST_KEEP_NATIVE_COUNTS', discovery: 'TEST_SOURCE_1920', 'style-fix': 'TEST_HERO_ONLY' }));
    const a = custom.load(dir), selected = custom.select(a, ['style-fix']);
    assert.match(selected[0].text, /TEST_HERO_ONLY/); assert.doesNotMatch(selected[0].text, /TEST_SOURCE_1920/);
    fs.appendFileSync(path.join(dir, 'custom-instructions.json'), '\n');
    assert.notEqual(custom.load(dir)[0].sha256, a[0].sha256);
    fs.writeFileSync(path.join(dir, 'custom-instructions.json'), '{');
    assert.throws(() => custom.load(dir));
  } finally { if (path.dirname(dir) === os.tmpdir() && path.basename(dir).startsWith('factory-v2-custom-')) fs.rmSync(dir, { recursive: true }); }
});
test('component checkpoint survives interruption, invalidates changed output/evidence, preserves history', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-v2-progress-'));
  try {
    fs.writeFileSync(path.join(dir, 'hero.scss'), '.hero {height:400px}'); fs.writeFileSync(path.join(dir, 'proof.json'), '{"passed":true}');
    progress.save(dir, 'hero', 'source-v1', { evidence: ['proof.json'], outputs: ['hero.scss'], result: { status: 'passed' } }, dir);
    assert.equal(progress.valid(dir, 'hero', 'source-v1', dir), true);
    assert.equal(progress.valid(dir, 'footer', 'source-v1', dir), false);
    assert.equal(progress.valid(dir, 'hero', 'source-v2', dir), false);
    fs.appendFileSync(path.join(dir, 'hero.scss'), '\n.hero{height:500px}');
    assert.equal(progress.valid(dir, 'hero', 'source-v1', dir), false);
    assert.throws(() => progress.save(dir, 'x', 's', { evidence: ['../outside'] }, dir), /outside root/);
  } finally { if (path.dirname(dir) === os.tmpdir() && path.basename(dir).startsWith('factory-v2-progress-')) fs.rmSync(dir, { recursive: true }); }
});
test('telemetry exposes Luna, unknown usage/cost remain null, configured estimates account for cached tokens', () => {
  const routing = routeTask(config, { type: 'style-fix' });
  const a = entry({ task: 'hero', routing, usage: null, status: 'fail' });
  assert.equal(a.model, 'luna'); assert.equal(a.inputTokens, null); assert.equal(a.cost, null);
  const b = entry({ task: 'hero', routing, usage: { input_tokens: 1000, cached_input_tokens: 800, output_tokens: 100 }, status: 'pass',
    pricing: { luna: { input: 1, cachedInput: 0.1, output: 2, source: 'TEST_RATE_NOT_REAL_PRICE' } } });
  assert.equal(b.cost, 0.00048);
});
test('component plan shares canonical components and excludes verified unchanged active-state sections', () => {
  const route = { id: 'home', path: '/', width: 1920, buildGroup: 'home', sections: ['shared-header', 'hero'] };
  const manifest = { routes: [route, { ...route, id: 'active', state: 'menu' }, { ...route, id: 'about', buildGroup: 'about', path: '/about', sections: ['shared-header', 'about-body'] }] };
  const families = { families: [{ key: 'home', baseRoute: 'home', routes: [{ id: 'home', sections: [{ id: 'shared-header' }, { id: 'hero' }] },
    { id: 'active', sections: [{ id: 'shared-header', sharedWithBase: false }, { id: 'hero', sharedWithBase: true }] }] }] };
  const p = require('./component-plan').plan(manifest, families);
  assert.equal(p.pages.some(t => t.id === 'active-hero'), false);
  assert.equal(p.shared.length, 2); assert.equal(p.pages.length, 2);
});
test('native demo clones have stable ownership, preserve source identity and never clone transactions', () => {
  const { demoClones } = require('./commerce-policy');
  const records = [{ id: 12, sourceId: 'figma-node-12' }];
  const planned = demoClones({ records, requiredCount: 3, kind: 'slide', owner: 'test' });
  assert.equal(planned.length, 2); assert.equal(planned[0].cloneOf, 12);
  assert.equal(demoClones({ records: [...records, ...planned.map((r, i) => ({ ...r, id: 20 + i }))], requiredCount: 3, kind: 'slide', owner: 'test' }).length, 0);
  assert.throws(() => demoClones({ records, requiredCount: 3, kind: 'order', owner: 'test' }));
  assert.throws(() => demoClones({ records: [], requiredCount: 3, kind: 'post', owner: 'test' }), /NO_SOURCE/);
});
test('existing evidence citation suffixes normalize without accepting commands or missing files', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'factory-v2-evidence-'));
  try {
    fs.writeFileSync(path.join(root,'proof.md'),'actual proof');
    const {result,changes}=require('./result-evidence').normalize({evidence:['proof.md: measured geometry','npm run build completed','missing.json: guessed']},root);
    assert.equal(result.evidence[0],'proof.md');assert.equal(changes.length,1);
    assert.equal(result.evidence[1],'npm run build completed');assert.equal(result.evidence[2],'missing.json: guessed');
  } finally {if(path.dirname(root)===os.tmpdir()&&path.basename(root).startsWith('factory-v2-evidence-'))fs.rmSync(root,{recursive:true});}
});
