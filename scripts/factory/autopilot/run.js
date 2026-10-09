const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const Ajv = require('ajv');
const { resolveLocalUrl, resolveWpContent, ROOT, CACHE, SNAPSHOT, read, write, hash, inside, fingerprint, engineFingerprint, alive, resolveCodex } = require('./common');
const { routeTask, validateRouter, continuationThread } = require('./model-router');
const taskProgress = require('./task-progress');
const capsuleBuilder = require('./task-capsule');
const telemetry = require('./telemetry');
const { CONTEXT_VERSION, prepareContext, correctionFocus } = require('./source-context');
const { prompt } = require('./prompts');
const canvasAudit = require('./canvas-audit');
const lockFile = path.join(CACHE, 'lock.json');
const currentFile = path.join(CACHE, 'current-v2.json'); // V1 run/checkpoints remain untouched.
const stopFile = path.join(CACHE, 'stop');
const now = () => new Date().toISOString();
const relative = f => path.relative(ROOT, f).replaceAll('\\', '/');
let activeChild = null;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function evidencePresent(file, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { if (fs.statSync(inside(ROOT, file)).isFile()) return true; } catch { /* Writer/filesystem may still be settling. */ }
    if (attempt < retries) await delay(100);
  }
  return false;
}
function terminate(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  else child.kill('SIGTERM');
}
function command(file, args, log) {
  const r = spawnSync(file, args, { cwd: ROOT, env: { ...process.env, NODE_ENV: 'production' }, encoding: 'utf8', timeout: 600000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  fs.writeFileSync(log, (r.stdout || '') + (r.stderr || '') + (r.error?.message || ''));
  if (r.status !== 0 || r.error) throw new Error(`COMMAND_FAILED: ${relative(log)}\n${((r.stderr || '') + (r.stdout || '')).slice(-2500)}`);
}
async function session({ executable, config, stage, task, dir, feedback, onChild, routing, resumeThreadId = null }) {
  fs.mkdirSync(dir, { recursive: true });
  const resultFile = path.join(dir, 'result.json');
  const { routes: _routes, ...promptTask } = task;
  routing ||= routeTask(config, task);
  const source = `Assignment capsule: ${relative(path.join(dir, 'task-capsule.json'))}. Read it first.\n` + prompt(stage, { ...promptTask, type: routing.type }, path.dirname(dir), feedback);
  const contextBytes = Buffer.byteLength(source) + fs.statSync(path.join(dir, 'task-capsule.json')).size;
  // Bytes are a conservative preflight bound, not a claim of tokenizer-accurate accounting.
  if (contextBytes > routing.budget.maxPromptBytes || contextBytes > routing.budget.remainingInputTokens) throw Error('TASK_INPUT_PREFLIGHT_BUDGET');
  fs.writeFileSync(path.join(dir, 'prompt.md'), source);
  const model = routing.model;
  // Isolate unrelated MCP/apps/plugins. Auth stays in the user's Codex home; no credentials are copied.
  // --approve-for-me already selects workspace-write and conflicts with an explicit --sandbox.
  const args = ['exec', '--ignore-user-config', '--approve-for-me', '-m', model,
    '-c', `model_reasoning_effort=${JSON.stringify(routing.reasoningEffort)}`,
    '-c', `tool_output_token_limit=${config.toolOutputTokenLimit}`,
    '-c', 'sandbox_workspace_write.network_access=true'];
  if (routing.type === 'source-extraction') args.push('-c', `mcp_servers.figma.url=${JSON.stringify(config.figmaMcpUrl)}`);
  const wpContent = resolveWpContent();
  for (const name of ['plugins', 'uploads']) {
    const folder = path.join(wpContent, name);
    if (fs.existsSync(folder)) args.push('--add-dir', folder);
  }
  if (resumeThreadId) args.push('resume', resumeThreadId);
  args.push('--json', '--output-schema', path.join(ROOT, 'factory/schemas/autopilot-result.schema.json'), '-o', resultFile, '-');
  write(path.join(dir, 'launch.json'), { stage, model: routing.alias, modelId: model, taskType: routing.type, reasoningEffort: routing.reasoningEffort, budget: routing.budget, contextPolicyVersion: CONTEXT_VERSION, toolOutputTokenLimit: config.toolOutputTokenLimit, resumeThreadId, executable, args, promptBytes: Buffer.byteLength(source), contextBytes, startedAt: now() });
  const child = spawn(executable, args, { cwd: ROOT, windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.setEncoding('utf8');
  activeChild = child;
  onChild(child.pid);
  const events = fs.createWriteStream(path.join(dir, 'events.jsonl'));
  const errors = fs.createWriteStream(path.join(dir, 'stderr.log'));
  let buffer = '', threadId = null, usage = null, failure = null, completed = false, observedBytes = contextBytes, outputBytes = 0;
  child.stdout.on('data', data => {
    events.write(data);
    buffer += data.toString();
    let split;
    while ((split = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, split); buffer = buffer.slice(split + 1);
      try {
        const e = JSON.parse(line);
        if (e.type === 'item.completed') {
          const text = e.item?.aggregated_output || e.item?.text || '';
          observedBytes += Buffer.byteLength(text);
          if (e.item?.type === 'agent_message') outputBytes += Buffer.byteLength(text);
          if (require('./context-budget').exceeded({observedBytes,outputBytes,itemBytes:Buffer.byteLength(text),budget:routing.budget})) {
            failure = { message: 'TASK_OBSERVED_CONTEXT_BUDGET' }; terminate(child);
          }
        }
        if (stage === 'discovery') require('./observations').saveObservation(e);
        if (e.type === 'thread.started') threadId = e.thread_id;
        if (e.type === 'turn.completed') { usage = e.usage; completed = true; }
        if (e.type === 'turn.failed') failure = e.error;
      } catch { /* Native stderr remains separate; partial JSON is buffered. */ }
    }
  });
  child.stderr.pipe(errors);
  const timeout = setTimeout(() => { failure = { message: 'STAGE_TIMEOUT' }; terminate(child); }, config.stageTimeoutMinutes * 60000);
  child.stdin.on('error', () => {});
  child.stdin.end(source);
  const exit = await new Promise(resolve => {
    child.on('error', error => resolve({ code: null, error: error.message }));
    child.on('close', (code, signal) => resolve({ code, signal }));
  });
  clearTimeout(timeout);
  await new Promise(resolve => events.end(resolve));
  activeChild = null;
  if (usage && (usage.input_tokens > routing.budget.remainingInputTokens || usage.output_tokens > routing.budget.remainingOutputTokens ||
    usage.input_tokens-(usage.cached_input_tokens || 0)>routing.budget.remainingUncachedInputTokens ||
    usage.input_tokens-(usage.cached_input_tokens||0)+usage.output_tokens>routing.budget.remainingUncachedTokens)) failure = { message: 'TASK_REPORTED_TOKEN_BUDGET' };
  const metadata = { startedModel: model, model: routing.alias, reasoningEffort: routing.reasoningEffort, threadId: threadId || resumeThreadId, resumedFrom: resumeThreadId, usage, exit, failure, completed, observedBytes, finishedAt: now() };
  write(path.join(dir, 'execution.json'), metadata);
  telemetry.record(path.dirname(dir), { task: task.id, routing, usage, status: failure || exit.code !== 0 ? 'fail' : 'awaiting-validation', dir, pricing: config.pricing });
  if (exit.code !== 0 || failure || !completed || !fs.existsSync(resultFile)) {
    const stderr = fs.readFileSync(path.join(dir, 'stderr.log'), 'utf8').slice(-2000);
    const err = new Error(`AGENT_EXECUTION_FAILED: ${relative(dir)}; ${JSON.stringify(failure || exit)}\n${stderr}`);
    err.execution = metadata;
    throw err;
  }
  const normalized = require('./result-evidence').normalize(read(resultFile), ROOT);
  const result = normalized.result;
  if (normalized.changes.length) write(path.join(dir, 'normalized-result.json'), normalized);
  const valid = new Ajv().compile(read(path.join(ROOT, 'factory/schemas/autopilot-result.schema.json')));
  if (!valid(result)) throw new Error(`INVALID_AGENT_RESULT: ${JSON.stringify(valid.errors)}`);
  result.evidence = result.evidence.map(f => f.trim());
  for (const f of result.evidence) if (!await evidencePresent(f)) throw new Error(`MISSING_AGENT_EVIDENCE: ${f}`);
  return { ...metadata, result };
}
function reconcileUsage(state) {
  let reported = 0;
  for (const attempt of state.attempts) {
    const file = path.join(attempt.dir, 'execution.json');
    if (!fs.existsSync(file)) { attempt.usageUnknown = true; continue; }
    const execution = read(file);
    attempt.usageUnknown = !execution.usage;
    if (!execution.usage) continue;
    attempt.usage = execution.usage;
    const u = execution.usage;
    reported += Math.max(0, (u.input_tokens || 0) - (u.cached_input_tokens || 0)) + (u.output_tokens || 0);
  }
  state.tokens = reported;
}
function report(state, dir) {
  const ready = state.status === 'complete';
  const lines = [`# Factory Autopilot ${state.id}`, '', `Status: ${state.status}`, `Ready for human review: ${ready ? 'YES' : 'NO'}`,
    `Local site: ${state.localUrl}`, `Updated: ${state.updatedAt}`, `Reported uncached input + output tokens: ${state.tokens}`,
    `Attempts without usage telemetry: ${state.attempts.filter(a => a.usageUnknown).length} (unknown usage is not zero; budget is a lower bound)`, '',
    ...((state.sourceDependencies || []).map(d=>`SOURCE INPUT REQUIRED: ${d.routeId}: ${d.missingInput} (${d.declaration})`)),
    ...((state.deferredVisual || []).map(d=>`VISUAL DEFERRED: ${d.id} (${d.comparison})`)),
    state.error || '', '', '| Task | Model | Result | Evidence |', '|---|---|---|---|',
    ...state.attempts.map(a => `| ${a.task} | ${a.model || 'see historical execution.json'} | ${a.status} | ${relative(a.dir)} |`), '',
    'Measured visual acceptance and independent review are both required. Missing evidence never means PASS.',
    `State: ${relative(path.join(dir, 'state.json'))}`, `Latest comparison: ${state.comparison || 'not captured'}`];
  fs.writeFileSync(path.join(dir, 'REPORT.md'), lines.join('\n') + '\n');
}
async function main(argv = process.argv.slice(2), dependencies = {}) {
  if (argv[0] === 'live') return require('../live/run').main(argv.slice(1));
  const runSession = dependencies.session || session;
  const runCommand = dependencies.command || command;
  fs.mkdirSync(CACHE, { recursive: true });
  const mode = argv[0] || 'run';
  const nativeLimitArg=argv.indexOf('--native-batch-limit');
  const nativeBatchLimit=nativeLimitArg<0?Infinity:Number(argv[nativeLimitArg+1]);
  if(nativeLimitArg>=0&&(!Number.isSafeInteger(nativeBatchLimit)||nativeBatchLimit<1))throw Error('INVALID_NATIVE_BATCH_LIMIT');
  let completedNativeBatches=0;
  if (!['run', 'resume', 'status', 'stop', 'plan', 'check'].includes(mode)) throw new Error('Usage: factory:autopilot [-- run|resume|status|stop|plan|check]');
  if (mode === 'status') {
    if (!fs.existsSync(currentFile)) return console.log('No autopilot run yet.');
    const c = read(currentFile), s = read(c.state);
    const lock = fs.existsSync(lockFile) ? read(lockFile) : null;
    console.log(JSON.stringify({ id: s.id, status: s.status, task: s.activeTask, model: s.activeModel, reasoningEffort: s.activeReasoningEffort, updatedAt: s.updatedAt,
      running: !!lock && (alive(lock.pid) || (lock.childPid && alive(lock.childPid))), tokens: s.tokens,
      attempts: s.attempts.length, usageIncomplete: s.attempts.some(a => a.usageUnknown), error: s.error, report: relative(path.join(path.dirname(c.state), 'REPORT.md')) }, null, 2));
    return;
  }
  if (mode === 'stop') {
    fs.writeFileSync(stopFile, now());
    if (fs.existsSync(currentFile)) {
      const current = read(currentFile);
      if (current.state && fs.existsSync(current.state)) {
        const state = read(current.state);
        const lock = fs.existsSync(lockFile) ? read(lockFile) : null;
        if (!lock || (!alive(lock.pid) && (!lock.childPid || !alive(lock.childPid)))) {
          state.status = 'stopped';
          state.activeTask = null;
          state.activeModel = null;
          state.activeReasoningEffort = null;
          state.error = 'STOP_REQUESTED';
          state.updatedAt = now();
          write(current.state, state);
          report(state, path.dirname(current.state));
          return console.log('Autopilot marked as stopped; no worker is running.');
        }
      }
    }
    return console.log('Stop requested. Current worker finishes; next stage will not launch.');
  }
  const config = read(path.join(ROOT, 'factory/autopilot.json'));
  const modelPolicy = validateRouter(config);
  const customInstructions = require('./custom-instructions').load(ROOT);
  if (!Number.isInteger(config.toolOutputTokenLimit) || config.toolOutputTokenLimit < 512 || config.toolOutputTokenLimit > 6000) throw new Error('Invalid tool output limit: expected 512..6000');
  if (!Number.isInteger(config.maxRepairPasses) || config.maxRepairPasses < 1 || !Number.isInteger(config.maxStageAttempts) || config.maxStageAttempts < 1 || config.stageTimeoutMinutes < 1 || config.maxUncachedTokens < 1) throw new Error('Invalid autopilot limits');
  const project = read(path.join(ROOT, 'factory/project.json'));
  const configHash = hash(fs.readFileSync(path.join(ROOT, 'factory/project.json')));
  const executable = resolveCodex();
  if (mode === 'plan' || mode === 'check') {
    console.log(JSON.stringify({ executable, localUrl: resolveLocalUrl(project), source: project.figma.url,
      modelPolicy, stages: ['complete-frame Figma audit', 'frozen cross-route architecture plan', 'global layout + native source content', 'shared component build + measured gate', 'canonical pages one by one', 'interaction-state deltas', 'full-page-diagnosed scoped repairs', 'checkpointed audit', 'Sol final verification + polish', 'fresh final acceptance'], config }, null, 2));
    if (mode === 'check') {
      const { wp } = require('./wp');
      const actual = wp(['option', 'get', 'home']);
      if (new URL(actual).hostname !== new URL(resolveLocalUrl(project)).hostname) throw new Error(`SITE_MISMATCH: runtime=${actual}`);
      console.log('Current WordPress identity verified. No site content changed.');
    }
    return;
  }
  if (fs.existsSync(lockFile)) {
    const lock = read(lockFile);
    if (alive(lock.pid) || (lock.childPid && alive(lock.childPid))) throw new Error('AUTOPILOT_ALREADY_RUNNING');
    if (mode !== 'resume') throw new Error('INTERRUPTED_RUN: use resume; history preserved');
    fs.renameSync(lockFile, path.join(CACHE, `interrupted-lock-${Date.now()}.json`));
  }
  let state, dir;
  if (mode === 'resume') {
    const c = read(currentFile); dir = path.dirname(inside(ROOT, c.state)); state = read(c.state);
    if (state.projectHash !== configHash) throw new Error('PROJECT_CHANGED: resume would target a different init configuration');
    if (state.status === 'complete') return console.log(`Already complete: ${relative(path.join(dir, 'REPORT.md'))}`);
    // The host may be interrupted after its child has atomically written a
    // completed execution/result pair, but before it can update state.json.
    // Recover that durable result on resume instead of treating it as a
    // running attempt and paying for the same worker again.
    let recoveredOrphan = false;
    for (const record of state.attempts.filter(a => a.status === 'running')) {
      const executionFile = path.join(record.dir, 'execution.json');
      const resultFile = path.join(record.dir, 'result.json');
      if (!fs.existsSync(executionFile) || !fs.existsSync(resultFile)) continue;
      const execution = read(executionFile);
      if (!execution.completed || execution.failure) continue;
      const result = read(resultFile);
      if (!['passed', 'needs_work', 'blocked'].includes(result.status)) continue;
      record.result = result;
      record.status = result.status;
      record.finishedAt = execution.finishedAt || now();
      record.threadId = execution.threadId || record.threadId;
      record.usage = execution.usage || record.usage;
      record.orphanRecovered = true;
      recoveredOrphan = true;
    }
    if (recoveredOrphan) {
      state.status = 'paused';
      state.activeTask = null; state.activeModel = null; state.activeReasoningEffort = null;
      state.error = null; state.errorStack = null; state.updatedAt = now();
      write(c.state, state);
    }
    // A completed worker can save its evidence milliseconds around the result
    // file on mounted workspaces. If the first validation observed that tiny
    // window, reuse the durable result now when every cited file exists;
    // never pay for a second audit just to repair that host-side race.
    let recoveredEvidence = false;
    for (const record of state.attempts.filter(a => /^(MISSING_AGENT_EVIDENCE:|ENGINE_CHANGED_BY_WORKER:)/.test(a.error || ''))) {
      const resultFile = path.join(record.dir, 'result.json');
      const executionFile = path.join(record.dir, 'execution.json');
      if (!fs.existsSync(resultFile) || !fs.existsSync(executionFile)) continue;
      const execution = read(executionFile);
      const normalized = require('./result-evidence').normalize(read(resultFile), ROOT).result;
      const valid = new Ajv().compile(read(path.join(ROOT, 'factory/schemas/autopilot-result.schema.json')));
      if (!execution.completed || execution.failure || !valid(normalized)) continue;
      let present = true;
      for (const evidence of normalized.evidence || []) if (!await evidencePresent(evidence, 0)) { present = false; break; }
      if (!present) continue;
      record.result = normalized; record.status = normalized.status; record.error = null;
      record.finishedAt = execution.finishedAt || record.finishedAt || now();
      record.threadId = execution.threadId || record.threadId;
      record.usage = execution.usage || record.usage;
      // An engine fingerprint is deliberately fail-closed while a worker is
      // active.  On an explicit resume, however, a completed, schema-valid
      // result with all of its evidence is durable input for the normal host
      // precheck below.  Keep the guard's audit trail, but do not discard the
      // worker's scoped change or charge an identical retry.
      if (/^ENGINE_CHANGED_BY_WORKER:/.test(record.error || '')) record.engineChangeRecovered = true;
      else record.evidenceRecovered = true;
      recoveredEvidence = true;
    }
    if (recoveredEvidence) {
      state.status = 'paused';
      state.activeTask = null; state.activeModel = null; state.activeReasoningEffort = null;
      state.error = null; state.errorStack = null; state.updatedAt = now();
      write(c.state, state);
    }
  } else {
    if (fs.existsSync(currentFile) && read(read(currentFile).state).status !== 'complete') throw new Error('UNFINISHED_RUN: use resume; do not discard history');
    const id = `${now().replace(/[:.]/g, '-')}-${process.pid}`;
    dir = path.join(CACHE, 'runs', id);
    state = { id, projectHash: configHash, localUrl: resolveLocalUrl(project), status: 'running', done: [], attempts: [], tokens: 0, round: 0, createdAt: now() };
  }
  fs.mkdirSync(dir, { recursive: true });
  const instructionsHash = hash(JSON.stringify(customInstructions));
  if (state.instructionsHash && state.instructionsHash !== instructionsHash) throw Error('CUSTOM_INSTRUCTIONS_CHANGED: start a distinct run; existing checkpoints are preserved');
  state.instructionsHash = instructionsHash;
  require('./custom-instructions').snapshot(ROOT, path.join(dir, 'custom-instructions.json'));
  const lock = { pid: process.pid, childPid: null, id: state.id, startedAt: now() };
  fs.writeFileSync(lockFile, JSON.stringify(lock), { flag: 'wx' });
  if (fs.existsSync(stopFile)) fs.unlinkSync(stopFile);
  const save = () => { reconcileUsage(state); state.updatedAt = now(); write(path.join(dir, 'state.json'), state); write(currentFile, { state: path.join(dir, 'state.json') }); report(state, dir); };
  const checkpoint = () => {
    if (fs.existsSync(stopFile)) throw new Error('STOP_REQUESTED');
    if (state.tokens >= config.maxUncachedTokens) throw new Error('TOKEN_BUDGET_REACHED');
  };
  let retainedSourceHash = null;
  const work = async (stage, task, feedback = '', force = false) => {
    const key = `v2:${stage}:${task.id}`;
    const fullPageTask = stage === 'build' && ['route-build', 'state-build'].includes(task.mode);
    // A completed checkpoint is authoritative on resume. Do not re-run the
    // worker merely because the derived task-progress cache was regenerated.
    if (!force && state.done.includes(key)) {
      const saved = taskProgress.result(dir, key);
      if (saved) return saved;
      const retainedResult=state.attempts.filter(attempt=>attempt.task===key&&attempt.result).at(-1)?.result;
      return retainedResult || {status:'passed',summary:'Durable host checkpoint retained',issues:[],evidence:[]};
    }
    const { comparison: _comparison, measurements: _measurements, ...stableTask } = task;
    const binding = hash(JSON.stringify({ task: stableTask, source: stage === 'discovery' ? state.projectHash : state.snapshotHash || state.projectHash, instructionsHash, visual: config.visual, version: 2 }));
    if (!force && !task.contentKeys && taskProgress.valid(dir, key, binding)) return taskProgress.result(dir,key);
    const completeTask = (result, outputs = []) => {
      taskProgress.save(dir, key, binding, { evidence: result.evidence, outputs, result });
      if (!state.done.includes(key)) state.done.push(key);
      if(task.contentKeys)completedNativeBatches++;
      save();
    };
    // A scoped corrector can establish that the capsule's expected geometry
    // contradicts both immutable source evidence and the live render. That is
    // not a worker failure to retry: retain it for final/audit review and let
    // unrelated corrections continue.
    const deferBlockedScopedCorrection = (blocked, attempt = null) => {
      if (stage !== 'correct' || task.contentKeys || !task.sections?.length || blocked?.status !== 'blocked') return null;
      const evidence = [...new Set([...(blocked.evidence || []), ...(task.measurements || []).map(measurement => measurement.evidence).filter(Boolean)])];
      if (!evidence.length) return null;
      state.deferredVisual ||= [];
      state.deferredVisual.push({ id: `blocked-correction:${key}`, task: key, sections: task.sections,
        comparison: evidence.join(', '), reason: `Scoped correction blocked: ${blocked.summary}. Retained for final audit instead of retrying the same capsule.` });
      const deferred = { status: 'passed',
        summary: 'Scoped correction could not safely reconcile contradictory source/geometry evidence; it is deferred to final audit without another model retry.',
        issues: ['Not visual acceptance. Review the retained blocker evidence during final audit.'], evidence };
      if (attempt) { attempt.status = 'passed'; attempt.result = deferred; attempt.deferredBlockedCorrection = true; }
      completeTask(deferred, capsuleBuilder.sourceFiles(task));
      console.log(`${now()} DEFERRED ${key}; blocked scoped correction retained for final audit`);
      return deferred;
    };
    const retainedBlocked = state.attempts.filter(a => a.task === key).at(-1);
    const deferredBlocked = deferBlockedScopedCorrection(retainedBlocked?.result, retainedBlocked);
    if (deferredBlocked) return deferredBlocked;
    if(task.contentKeys){
      if(completedNativeBatches>=nativeBatchLimit)throw Error('NATIVE_BATCH_LIMIT_REACHED: bounded verification complete; remaining tasks retained');
      const proof=path.join(dir,`native-probe-${hash(key).slice(0,16)}-${Date.now()}.json`);
      const native=await require('./native-batch').verify(task,proof);
      if(native.passed){
        const result={status:'passed',summary:'All assigned native records verified in runtime; no import retry needed',issues:[],evidence:[relative(proof)]};
        completeTask(result);return result;
      }
    }
    // A completed result can be validated without another paid attempt. Retain the overrun;
    // budget exhaustion prevents model retries, not deterministic inspection of existing work.
    const retained=state.attempts.filter(a=>a.task===key).at(-1);
    const retainedExecution=retained && fs.existsSync(path.join(retained.dir,'execution.json')) ? read(path.join(retained.dir,'execution.json')) : null;
    if (retainedExecution?.completed && retainedExecution.failure?.message==='TASK_REPORTED_TOKEN_BUDGET' &&
      !task.contentKeys && ['foundation','build'].includes(stage) && fs.existsSync(path.join(retained.dir,'result.json'))) {
      const result=require('./result-evidence').normalize(read(path.join(retained.dir,'result.json')),ROOT).result;
      const validate=new Ajv().compile(read(path.join(ROOT,'factory/schemas/autopilot-result.schema.json')));
      if (validate(result) && result.status==='passed' && result.evidence.every(f=>fs.existsSync(inside(ROOT,f)))) {
        checkpoint();
        if (stage !== 'discovery' && state.snapshotHash && require('./visual').sourceHash()!==state.snapshotHash) throw Error('FROZEN_SNAPSHOT_CHANGED');
        const recovery=path.join(dir,`retained-result-${hash(key).slice(0,16)}-${Date.now()}`);
        fs.mkdirSync(recovery,{recursive:true});
        const engineBefore=engineFingerprint();
        runCommand(process.execPath,['node_modules/webpack-cli/bin/cli.js','--mode=production'],path.join(recovery,'build.log'));
        const measurements=[];
        for(const route of !fullPageTask && task.sections?.length ? task.routes : []) measurements.push(await require('./component-visual').capture({route,sections:task.sections,
          output:path.join(recovery,typeof route==='string'?route:route.id)}));
        if (engineFingerprint()!==engineBefore) throw Error('ENGINE_CHANGED_DURING_RETAINED_VALIDATION');
        if(measurements.every(m=>m.passed)) {
          const proof=path.join(recovery,'validation.json');
          write(proof,{status:'passed',kind:'host-revalidation-of-completed-result',originalExecution:relative(path.join(retained.dir,'execution.json')),
            budgetOverrunRetained:true,usage:retainedExecution.usage,measurements,note:'No new model call. Foundation without sections has build/evidence validation only; shared visual gates remain mandatory.'});
          result.evidence.push(relative(proof),relative(path.join(recovery,'build.log')));
          retained.budgetOverrun=true;retained.validation=relative(proof);
          completeTask(result,[...capsuleBuilder.sourceFiles(task),...result.evidence.filter(f=>/^(src|partials|functions|scripts\/factory\/project)\/|^[^/]+\.php$/.test(f))]);
          console.log(`${now()} RECOVERED ${key}; existing completed output validated without model retry`);
          return result;
        }
      }
    }
    if (stage === 'discovery' && task.scope !== 'canvas-backfill' && !customInstructions.length && read(path.join(SNAPSHOT,'manifest.json')).status === 'complete') {
      const gate = task.scope === 'inventory' ? require('./gates').inventory() : require('./gates').group(task.buildGroup,task.sections || null);
      if (gate.passed) {
        const proof=path.join(dir,`retained-source-${hash(key).slice(0,16)}.json`);
        retainedSourceHash ||= require('./visual').sourceHash();
        write(proof,{gate,sourceHash:retainedSourceHash,scope:task.sections || 'inventory',note:'Validated complete local snapshot reused; no new Figma request or source review claimed.'});
        completeTask({status:'passed',summary:'Validated complete source cache retained',issues:[],evidence:[relative(proof)]});
        return;
      }
    }
    // This is an independently captured host measurement, not a paid model
    // attempt. Retain it locally so bounded visual deferral can use it as a
    // confirming healthy sample after an interrupted/ambiguous worker gate.
    let precheckMeasurements = [];
    if (!fullPageTask && !task.contentKeys && task.sections?.length && ['foundation','build','correct','final'].includes(stage)) {
      checkpoint();
      const measurements=[];
      for(const route of task.routes) measurements.push(await require('./component-visual').capture({route,sections:task.sections,
        output:path.join(dir,`precheck-${hash(key).slice(0,16)}-${Date.now()}`,typeof route==='string'?route:route.id)}));
      if (['foundation','build','correct'].includes(stage) && task.type !== 'final-polish' && measurements.every(m=>m.passed)) {
        const result={status:'passed',summary:'Existing component independently measured; no worker needed',issues:[],evidence:measurements.map(m=>m.evidence)};
        completeTask(result,capsuleBuilder.sourceFiles(task));
        console.log(`${now()} REUSED ${key}; fresh component gate passed without model tokens`);
        return result;
      }
      task={...task,measurements};
      precheckMeasurements = measurements;
    }
    let pageChecks = [], declaredDependencies = [];
    const deferBuild = async (output, result = null) => {
      const checks=[];
      for(const route of [...task.routes].sort((a,b)=>Number(!!a.state)-Number(!!b.state))) checks.push(await require('./visual').captureAll({output:path.join(output,route.id),routeId:route.id,acceptanceScope:'page'}));
      pageChecks = checks;
      const dependencyPolicy = require('./source-dependencies');
      const dependencyEvidence = [...new Set([...(state.pendingSourceDependencies || []).filter(d=>d.task===key).map(d=>d.declaration),...(result?.evidence || [])])];
      declaredDependencies = dependencyPolicy.dependencies({evidence:dependencyEvidence},task.routes);
      state.pendingSourceDependencies = [...(state.pendingSourceDependencies || []).filter(d=>d.task!==key),...declaredDependencies.map(d=>({...d,task:key}))];
      const accepted = fullPageTask
        ? checks.every(check => check.pagePassed === true)
        : checks.every(check => check.buildReady || dependencyPolicy.carryable(check,declaredDependencies.find(d=>d.routeId===check.routes[0]?.id)));
      if(!accepted) return false;
      state.deferredVisual ||= [];
      for(const c of checks) state.deferredVisual.push(...c.deferred);
      state.sourceDependencies ||= [];
      for (const d of declaredDependencies) {
        const c = checks.find(c=>c.routes[0]?.id===d.routeId);
        if (c && !c.buildReady) state.sourceDependencies.push({...d, comparison:c.routes[0].comparison, task:key});
      }
      if(!state.done.includes(key)) state.done.push(key);
      save(); console.log(`${now()} BUILD READY ${key}; deferred issues retained: ${checks.flatMap(c=>c.deferred).length}`);
      return true;
    };
    if(stage==='build' && (fullPageTask || !task.sections) && state.attempts.some(a=>a.task===key)) {
      checkpoint();
      runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(dir, 'resume-build.log'));
      if(await deferBuild(path.join(dir,`resume-page-check-${Date.now()}`),state.attempts.filter(a=>a.task===key).at(-1)?.result)) return {status:'needs_work',summary:'Build handoff ready; final audit owns deferred visual findings and missing-source dependencies',issues:[]};
    }
    // maxStageAttempts is the public retry contract. Task-level budgets may
    // tighten it, but can never silently turn a two-attempt stage into 16.
    const maxTaskAttempts = require('./model-router').attemptLimit(config, task);
    const attemptsForTask = () => state.attempts.filter(a => a.task === key);
    const attemptHistory = require('./attempt-history');
    const semanticRepair = attemptHistory.isSemanticRepair(task);
    const semanticHistory = attemptHistory.forTask(state, task);
    const capacityFailure = attempt => /selected model is at capacity|model is at capacity|capacity limit/i.test(attempt?.error || '');
    // Capacity is provider availability, not an implementation finding. If
    // Terra could not start, resume the same bounded task with Luna rather
    // than pausing the whole run or spending a visual-repair attempt.
    state.capacityFallbacks ||= {};
    const latestCapacity = attemptsForTask().at(-1);
    if (capacityFailure(latestCapacity) && latestCapacity.modelAlias !== 'luna' && !state.capacityFallbacks[key]) {
      state.capacityFallbacks[key] = { from: latestCapacity.modelAlias, to: 'luna', attempt: relative(latestCapacity.dir), at: now() };
      task = { ...task, onlyModel: 'luna' };
      save();
    }
    // A measured visual repair can fail because the original source
    // projection omitted a visible node. One separately labelled
    // source-recovery turn is allowed for both component builds and scoped
    // corrections: it has full-page evidence and Figma access, so it is a
    // diagnostic correction rather than a blind retry.
    // Persisting this marker makes the recovery strictly once-only across
    // resume/restart.
    state.visualSourceRecoveries ||= {};
    state.sourceRestFallbacks ||= {};
    const retriableSourceAuth = attempt => attempt?.taskType === 'source-extraction' && attempt?.result?.status === 'blocked'
      && /figma mcp authentication|authrequired|mcp.*auth/i.test(`${attempt.result.summary || ''}\n${(attempt.result.issues || []).join('\n')}`);
    // A diagnostic file may have been captured immediately before a process
    // interruption. It is not proof that the Figma-backed worker ran; only a
    // recorded source-extraction attempt consumes this once-only recovery.
    const sourceRecoveryDone = () => state.visualSourceRecoveries[key] || state.sourceRestFallbacks[key]
      || (semanticRepair && semanticHistory.source.some(a => !retriableSourceAuth(a)))
      || attemptsForTask().some(a => a.taskType === 'source-extraction' && !retriableSourceAuth(a));
    const canRecoverVisualSource = () => semanticRepair && task.sections?.length && !sourceRecoveryDone()
      && ((stage === 'build' && task.type === 'component-build') || stage === 'correct');
    // A capture which could not open the declared WordPress route is an
    // environment-readiness failure, not a model attempt. Do not charge it
    // against a component's bounded repair budget; the route resolver will
    // provision/normalize it before the next deterministic precheck.
    const billableAttempts = () => attemptsForTask().filter(a => {
      if (retriableSourceAuth(a)) return false;
      const gateFile = path.join(a.dir, 'component-gate.json');
      const gate = fs.existsSync(gateFile) ? read(gateFile) : null;
      if (require('./route-readiness').unavailableCapture(gate?.measurements)) return false;
      // A worker blocked solely because an old capsule omitted the renderer is
      // a planner failure. The next capsule gets deterministic fallback files;
      // do not spend the section's model budget twice on that same omission.
      const text = [a.result?.summary, ...(a.result?.issues || [])].join('\n');
      return !/scope expansion|required .*scope|outside (the )?capsule file scope|implementation is out of capsule scope/i.test(text);
    });
    const exhausted = billableAttempts();
    // A healthy local visual gate deliberately defers residual raster/text
    // mismatch. This applies both to component builds and scoped corrections:
    // if geometry and source images are healthy across two captures below the
    // controlled ceiling, retain it for the deterministic whole-page/final
    // phase rather than escalating to Terra or Figma. This is never visual
    // acceptance; final acceptance still compares the complete route.
    const deferHealthyComponent = () => {
      if (fullPageTask || !task.sections?.length || !((stage === 'build' && task.type === 'component-build') || stage === 'correct')) return null;
      const candidates = attemptsForTask();
      const latest = candidates.at(-1);
      const gateFile = latest && path.join(latest.dir, 'component-gate.json');
      const gate = gateFile && fs.existsSync(gateFile) ? read(gateFile) : null;
      const captures = candidates.map(a => {
        const f = path.join(a.dir, 'component-gate.json');
        const value = fs.existsSync(f) ? read(f) : null;
        return value?.measurements || [];
      }).flat();
      const decision = require('./component-deferral').decide([...captures, ...precheckMeasurements], config.visualDeferral);
      if (!decision) return null;
      const evidence = precheckMeasurements.at(-1)?.evidence || relative(gateFile);
      state.deferredVisual ||= [];
      state.deferredVisual.push({ id: `component:${task.id}`, task: key, sections: task.sections, comparison: evidence,
        reason: `Latest local component mismatch (${decision.last.toFixed(4)}) reached the controlled deferral ceiling after ${decision.samples.length} healthy captures${decision.materiallyImproved ? ` (improved by ${decision.improvement.toFixed(4)})` : ''}; whole-page geometry and final visual audit remain required.` });
      const result = { status: 'passed', summary: 'Scoped visual repair is runtime/geometry healthy; bounded local pixel mismatch deferred to the final whole-page repair phase.', issues: ['Not a visual acceptance. See retained component gate.'], evidence: [evidence] };
      completeTask(result, capsuleBuilder.sourceFiles(task));
      console.log(`${now()} DEFERRED ${key}; healthy component mismatch retained for page audit`);
      return result;
    };
    // Once the bounded Luna/Terra repair pair has demonstrated that runtime,
    // source ownership and geometry are healthy, a remaining pixel mismatch
    // belongs to the final whole-page audit even if it exceeds the local
    // deferral ceiling. Retrying the same scoped component cannot add a new
    // measurement and must not pause the entire run.
    const deferExhaustedHealthyComponent = () => {
      if (fullPageTask || !task.sections?.length || !((stage === 'build' && task.type === 'component-build') || stage === 'correct')) return null;
      const candidates = attemptsForTask();
      const latest = candidates.at(-1);
      const gateFile = latest && path.join(latest.dir, 'component-gate.json');
      const gate = gateFile && fs.existsSync(gateFile) ? read(gateFile) : null;
      const measurement = gate?.measurements?.at(-1) || precheckMeasurements.at(-1);
      if (!require('./component-deferral').healthyCapture(measurement)) return null;
      const ratios = measurement.sections.map(section => section.pixels?.layoutRatio ?? section.pixels?.ratio).filter(Number.isFinite);
      const ratio = ratios.length ? Math.max(...ratios) : null;
      const evidence = measurement.evidence || relative(gateFile);
      state.deferredVisual ||= [];
      state.deferredVisual.push({ id: `component-exhausted:${task.id}`, task: key, sections: task.sections, comparison: evidence,
        reason: `Bounded local repair exhausted with healthy runtime/geometry/source ownership${ratio === null ? '' : ` and residual pixel mismatch ${ratio.toFixed(4)}`}; final whole-page audit owns the remaining visual judgment.` });
      const result = { status: 'passed',
        summary: 'Bounded scoped repair exhausted with healthy runtime, geometry and source ownership; residual pixel mismatch deferred to final whole-page audit.',
        issues: ['Not visual acceptance. See retained component gate.'], evidence: [evidence] };
      completeTask(result, capsuleBuilder.sourceFiles(task));
      console.log(`${now()} DEFERRED ${key}; exhausted healthy component retained for final audit`);
      return result;
    };
    const recoverScopeOnlyComponent = () => {
      if (fullPageTask || task.type !== 'component-build' || !task.sections?.length) return null;
      const latest = attemptsForTask().at(-1);
      const gateFile = latest && path.join(latest.dir, 'component-gate.json');
      const gate = gateFile && fs.existsSync(gateFile) ? read(gateFile) : null;
      const scopeOnly = latest?.result?.status === 'needs_work' && latest.result.issues?.length
        && latest.result.issues.every(issue => /scope expansion|file scope|outside the capsule file scope/i.test(issue));
      if (!gate?.passed || !scopeOnly) return null;
      const result = { ...latest.result, status: 'passed',
        summary: `${latest.result.summary} Host accepted the independently passed component gate; the remaining issue was capsule documentation scope only.`,
        issues: [], evidence: [...new Set([...(latest.result.evidence || []), relative(gateFile)])] };
      completeTask(result, capsuleBuilder.sourceFiles(task));
      console.log(`${now()} RECOVERED ${key}; independently passed component gate resolved scope-only worker result`);
      return result;
    };
    const recoveredScope = recoverScopeOnlyComponent();
    if (recoveredScope) return recoveredScope;
    // A source-recovery worker may complete and update the frozen snapshot,
    // yet be interrupted while its result evidence is normalized. On resume,
    // validate that completed recovery with a host build/capture instead of
    // spending another Luna/Terra turn or failing at the old retry cap.
    const recoverCompletedSourceRecovery = async () => {
      const latest = attemptsForTask().at(-1);
      if (fullPageTask || latest?.taskType !== 'source-extraction' || !latest.result || !task.sections?.length) return null;
      const source = require('./visual').sourceHash();
      if (state.snapshotHash !== source) {
        state.snapshotHash = source;
        state.snapshotHashVersion = 2;
        save();
      }
      const verification = path.join(dir, `source-recovery-verification-${hash(key).slice(0,16)}-${Date.now()}`);
      runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(verification, 'build.log'));
      const measurements = [];
      for (const route of task.routes) measurements.push(await require('./component-visual').capture({
        route, sections: task.sections, output: path.join(verification, typeof route === 'string' ? route : route.id)
      }));
      const proof = path.join(verification, 'component-gate.json');
      write(proof, { passed: measurements.every(measurement => measurement.passed), measurements,
        sourceRecovery: relative(latest.dir), verifiedAt: now() });
      if (measurements.every(measurement => measurement.passed)) {
        const result = { ...latest.result, status: 'passed', issues: [],
          summary: `${latest.result.summary} Host recapture accepted the recovered source.`,
          evidence: [...new Set([...(latest.result.evidence || []), relative(proof), relative(path.join(verification, 'build.log'))])] };
        completeTask(result, [...capsuleBuilder.sourceFiles(task), relative(proof)]);
        console.log(`${now()} RECOVERED ${key}; completed source recovery passed host verification without a new model call`);
        return result;
      }
      state.deferredVisual ||= [];
      state.deferredVisual.push({ id: `source-recovery:${key}`, task: key, sections: task.sections,
        comparison: relative(proof), reason: 'Figma source recovery completed, but fresh component verification still differs; retain it for the next whole-page repair round.' });
      const result = { status: 'passed', issues: [],
        summary: 'Figma source recovery completed but its component gate remains unresolved; host retained fresh evidence and will continue whole-page repair.',
        evidence: [...new Set([...(latest.result.evidence || []), relative(proof), relative(path.join(verification, 'build.log'))])] };
      completeTask(result, [...capsuleBuilder.sourceFiles(task), relative(proof)]);
      console.log(`${now()} DEFERRED ${key}; source recovery verified without a new model call and retained for whole-page repair`);
      return result;
    };
    const recoveredSource = await recoverCompletedSourceRecovery();
    if (recoveredSource) return recoveredSource;
    // A round number is not a fresh repair budget. If this semantic route
    // section already consumed Luna + Terra and one source recovery in an
    // earlier round, retain the current host measurement for route-level Sol
    // or human review instead of replaying the same three paid calls.
    if (semanticRepair && stage === 'correct' && !attemptsForTask().length && semanticHistory.repair.length >= maxTaskAttempts && semanticHistory.source.length) {
      const evidence=precheckMeasurements.map(measurement=>measurement.evidence);
      state.deferredVisual ||= [];
      state.deferredVisual.push({id:`semantic-budget:${semanticHistory.key}`,task:key,sections:task.sections,comparison:evidence.join(', '),
        reason:'Semantic Luna/Terra/source-recovery budget was already consumed in an earlier round; current measurement is retained without another model call.'});
      const result={status:'passed',summary:'Repeated semantic repair suppressed; fresh measurement retained for route-level Sol/human review.',
        issues:['Not visual acceptance. The same route/section repair budget was already consumed.'],evidence};
      completeTask(result,capsuleBuilder.sourceFiles(task));
      console.log(`${now()} SUPPRESSED ${key}; semantic repair budget already consumed across rounds`);
      return result;
    }
    if (exhausted.length >= maxTaskAttempts) {
      const deferred = deferHealthyComponent() || deferExhaustedHealthyComponent();
      if (deferred) return deferred;
    }
    // On resume, begin at the number of already charged attempts. Starting
    // from zero would ask the router for an ordinary third attempt before it
    // can enter the recovery branch, causing TASK_ATTEMPTS_EXHAUSTED.
    const historicalRepairExhausted = semanticRepair && stage === 'correct' && !attemptsForTask().length && semanticHistory.repair.length >= maxTaskAttempts;
    for (let attempt = historicalRepairExhausted ? maxTaskAttempts : exhausted.length; attempt < maxTaskAttempts + (canRecoverVisualSource() ? 1 : 0); attempt++) {
      checkpoint();
      const sourceRecovery = attempt >= maxTaskAttempts;
      if (sourceRecovery) {
        const recoveryDir = path.join(dir, `source-recovery-${Date.now()}`);
        const fullPage = [];
        for (const route of task.routes) fullPage.push(await require('./visual').captureAll({ output: path.join(recoveryDir, typeof route === 'string' ? route : route.id), routeId: typeof route === 'string' ? route : route.id, acceptanceScope: 'all' }));
        const recoveryEvidence = path.join(recoveryDir, 'diagnosis.json');
        write(recoveryEvidence, { version: 1, kind: 'visual-source-recovery', task: key, sections: task.sections,
          reason: 'Normal visual repair budget exhausted; recover missing source facts from exact Figma nodes before any further visual correction.',
          componentMeasurements: attemptsForTask().map(a => relative(path.join(a.dir, 'component-gate.json'))).filter(f => fs.existsSync(inside(ROOT, f))),
          fullPage: fullPage.map(p => p.summary || p), capturedAt: now() });
        state.visualSourceRecoveries[key] = relative(recoveryEvidence);
        state.semanticSourceRecoveries ||= {};
        state.semanticSourceRecoveries[semanticHistory.key] = relative(recoveryEvidence);
        // A previous blocked MCP-only recovery gets one more source turn,
        // now explicitly instructed to use the REST token fallback.
        if (attemptsForTask().some(retriableSourceAuth)) state.sourceRestFallbacks[key] = relative(recoveryEvidence);
        save();
        task = { ...task, class: undefined, type: 'source-extraction', sourceRecovery: true, diagnostic: relative(recoveryEvidence),
          // The source recovery is a separately bounded third turn. Keep the
          // original component cap for normal repairs, but let the router
          // admit this one explicit diagnostic call.
          budget: { ...(task.budget || {}), maxAttempts: Math.min(config.taskBudgets.maxAttempts, maxTaskAttempts + 1) } };
        feedback = `SOURCE_RECOVERY_REQUIRED: ${relative(recoveryEvidence)}. The normal component budget is exhausted. Use this one Figma-backed recovery turn to correct missing source facts, then the host will recapture.`;
      }
      state.activeTask = key; state.status = 'running'; state.error = null; state.errorStack = null;
      const routing = routeTask(config, task, billableAttempts());
      const model = routing.model;
      state.activeModel = model; state.activeReasoningEffort = routing.reasoningEffort;
      const attemptDir = path.join(dir, `${String(state.attempts.length + 1).padStart(3, '0')}-${stage}-${task.id}`);
      const previous = attemptsForTask().at(-1);
      const previousExecution = previous && fs.existsSync(path.join(previous.dir, 'execution.json')) ? read(path.join(previous.dir, 'execution.json')) : null;
      // A budget pause must not discard the completed worker's remaining-issues handoff.
      if (!feedback && previous?.result?.status === 'needs_work') feedback = JSON.stringify(previous.result);
      const repairResult = /^(MISSING_AGENT_EVIDENCE|INVALID_AGENT_RESULT):/.test(previous?.error || '');
      const previousLaunchFile = previous && path.join(previous.dir, 'launch.json');
      const previousLaunch = previousLaunchFile && fs.existsSync(previousLaunchFile) ? read(previousLaunchFile) : null;
      const contextCompatible = previousLaunch?.contextPolicyVersion === CONTEXT_VERSION && previousLaunch?.toolOutputTokenLimit === config.toolOutputTokenLimit;
      const resumeThreadId = task.type==='final-audit' && previousExecution && !previousExecution.completed && previousExecution.startedModel===model
        ? previousExecution.threadId : contextCompatible && !task.auditCheckpoint ? continuationThread(previousExecution, model, repairResult) : null;
      if (repairResult) feedback = `Your previous turn completed but its result failed validation: ${previous.error}. Fix only the result/evidence contract. Do not repeat completed source reads or implementation. Evidence entries must be existing theme-relative FILE paths, never commands or explanations. Save any missing gate output to a real file, then return the corrected schema response.`;
      if (stage === 'discovery') {
        for (const a of state.attempts.filter(a => a.task === key)) await require('./observations').recover(path.join(a.dir, 'events.jsonl'));
      }
      const currentGate = stage === 'discovery' ? (task.scope === 'inventory' ? require('./gates').inventory() : task.scope === 'canvas-backfill' ? (() => { const errors = canvasAudit.validate(read(path.join(SNAPSHOT,'manifest.json')), '1.1'); return { passed: !errors.length, errors }; })() : require('./gates').group(task.buildGroup, task.sections || null)) : null;
      let focusedTask = stage==='build' && pageChecks.length ? {...task,routes:task.routes.filter(r=>{
        const check = pageChecks.find(c=>c.routes[0]?.id===r.id);
        if(fullPageTask)return !check?.pagePassed;
        return !check?.buildReady && !(check && require('./source-dependencies').carryable(check,declaredDependencies.find(d=>d.routeId===r.id)));
      })} : task;
      if(stage==='build' && (fullPageTask || !task.sections)) {
        const plan=require('./state-plan').load(require('./source-geometry').resolveManifest());
        const pendingBases=focusedTask.routes.filter(r=>!r.state && plan?.families.some(f=>f.baseRoute===r.id));
        if(pendingBases.length) focusedTask={...focusedTask,routes:pendingBases};
      }
      const sourceContext = prepareContext(stage, focusedTask, attemptDir);
      const capsule = capsuleBuilder.create({ stage, task: focusedTask, routing, dir: attemptDir, sourceContext, feedback, instructions: customInstructions });
      let currentPageVerification = null;
      const latestVisual = path.join(CACHE, 'latest-visual.json');
      if (stage === 'build' && fs.existsSync(latestVisual)) {
        const summaryFile = inside(ROOT, read(latestVisual).summary);
        const summary = read(summaryFile);
        if (summary.implementationHash === fingerprint() && summary.sourceHash === state.snapshotHash && JSON.stringify(summary.thresholds) === JSON.stringify(config.visual)) {
          currentPageVerification = { summary: relative(summaryFile), routes: summary.routes.filter(r => task.routes.some(t => t.id === r.id)),
            instruction: 'Current matching measurement. If pagePassed is true, do not repeat page corrections solely because shared owners fail. Complete reusable-component work if required, check regressions, and hand off shared findings for final audit.' };
        }
      }
      if (stage==='build' && pageChecks.length) currentPageVerification = { routes:pageChecks.flatMap(c=>c.routes), instruction:'Fresh host checks for all sibling routes. Repair only failed assigned routes.' };
      write(path.join(attemptDir, 'handoff.json'), {
        task: { id: task.id, scope: task.scope, buildGroup: task.buildGroup, comparison: task.comparison, issues: task.issues }, sourceContext, model, reasoningEffort: routing.reasoningEffort,
        continuation: resumeThreadId ? 'same-model interrupted thread' : previousExecution ? 'fresh session using persisted artifacts; do not load historical conversation' : 'new task',
        previousExecution: previousExecution ? relative(path.join(previous.dir, 'execution.json')) : null,
        previousResult: previous?.result ? relative(path.join(previous.dir, 'result.json')) : null,
        correctionFocus: correctionFocus(previous?.result),
        currentPageVerification, auditCheckpoint:task.auditCheckpoint || null,
        snapshot: relative(SNAPSHOT), observations: relative(path.join(SNAPSHOT, 'observations/index.json')),
        plans: [path.join(dir,'execution-plan.json'),path.join(dir,'component-plan.json'),path.join(dir,'route-blueprints.json'),path.join(SNAPSHOT,'implementation-plan.md')]
          .filter(file=>fs.existsSync(file)).map(relative),
        currentGate,
        instruction: currentGate?.passed ? 'The current structural gate already passes. Verify source completeness only for this assigned group, finish its documentation and return. Do not repeat completed discovery.' : 'Inspect the current gate and finish only remaining assigned work. Reuse real saved source facts and assets.'
      });
      const record = { task: key, model, modelAlias: routing.alias, taskType: routing.type, reasoningEffort: routing.reasoningEffort, dir: attemptDir, status: 'running', startedAt: now() };
      state.attempts.push(record); save();
      console.log(`${now()} START ${key} [${model} ${routing.reasoningEffort}] (${relative(attemptDir)})`);
      const engine = engineFingerprint();
      const implementationBefore = fingerprint();
      const filesBefore = taskProgress.implementationFiles();
      record.reviewGuardBefore={engine,implementation:implementationBefore,source:state.snapshotHash || null,init:configHash};save();
      try {
        const execution = await runSession({ executable: executable.file, config, stage, task:focusedTask, dir: attemptDir, feedback, resumeThreadId, routing,
          onChild: pid => { lock.childPid = pid; write(lockFile, lock); } });
        lock.childPid = null; write(lockFile, lock);
        const u = execution.usage || {};
        record.usage = u; record.threadId = execution.threadId; record.finishedAt = now();
        if (engineFingerprint() !== engine) throw new Error('ENGINE_CHANGED_BY_WORKER: review before continuing');
        if (stage !== 'discovery' && state.snapshotHash && require('./visual').sourceHash() !== state.snapshotHash) {
          // The one source-recovery turn is the explicit exception to the
          // frozen-snapshot rule: it exists precisely to persist omitted
          // facts from the same Figma file. Rebind the run to those audited
          // bytes; every other worker changing source remains a hard stop.
          if (!sourceRecovery) throw new Error('FROZEN_SNAPSHOT_CHANGED: original design evidence must remain immutable');
          state.snapshotHash = require('./visual').sourceHash();
          state.snapshotHashVersion = 2;
          save();
        }
        if (['audit', 'final'].includes(stage) && routing.type !== 'final-polish' && fingerprint() !== implementationBefore) throw new Error('REVIEWER_CHANGED_IMPLEMENTATION');
        if (hash(fs.readFileSync(path.join(ROOT, 'factory/project.json'))) !== configHash) throw new Error('INIT_CHANGED_BY_WORKER');
        const result = execution.result;
        // Global foundation has structural acceptance only. Visual section
        // measurements belong to component/page stages; without assigned
        // sections a needs_work response would create an endless retry loop.
        if (stage === 'foundation' && task.id === 'global-layout' && !task.sections?.length && result.status === 'needs_work') {
          result.status = 'passed';
          result.summary += ' Structural foundation accepted; visual QA is deferred to assigned component/page stages.';
        }
        record.result = result; record.status = result.status;
        if(task.contentKeys && result.status==='passed'){
          const file=path.join(attemptDir,'native-batch-probe.json');
          const verified=await require('./native-batch').verify(task,file);
          if(!verified.passed)throw Error(`COMMAND_FAILED: ${verified.errors.join('; ')}; implement/read the scoped native-batch.verifyBatch probe`);
          result.evidence.push(relative(file));
        }
        if (!fullPageTask && !task.contentKeys && task.sections?.length && ['foundation', 'build', 'correct', 'final'].includes(stage) && ['passed', 'needs_work'].includes(result.status)) {
          runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(attemptDir, 'build.log'));
          const measurements = [];
          for (const route of task.routes) measurements.push(await require('./component-visual').capture({ route, sections: task.sections, output: path.join(attemptDir, `component-${typeof route === 'string' ? route : route.id}`) }));
          write(path.join(attemptDir, 'component-gate.json'), { passed: measurements.every(m => m.passed), measurements });
          result.evidence.push(relative(path.join(attemptDir, 'component-gate.json')));
          if (!measurements.every(m => m.passed)) {
            task = { ...task, measurements };
            record.status = 'needs_work'; feedback = JSON.stringify(measurements.map(m => ({ evidence: m.evidence, errors: m.errors, sections: m.sections.map(s => ({ id: s.id, passed: s.passed, expected: s.expected, actual: s.actual, ratio: s.pixels?.ratio })) })));
            save();
            const deferred = deferHealthyComponent();
            if (deferred) return deferred;
            if (sourceRecovery) {
              const recoveryEvidence = state.visualSourceRecoveries[key];
              state.deferredVisual ||= [];
              state.deferredVisual.push({ id: `component:${task.id}`, task: key, sections: task.sections,
                comparison: recoveryEvidence, reason: 'Figma-backed source recovery was attempted after normal component retries. The component still fails its fresh gate, so its full-page and source evidence are retained for the final repair/audit instead of pausing unrelated autopilot work.' });
              const result = { status: 'passed', summary: 'Component remains visually unresolved after its single Figma-backed recovery; evidence is queued for whole-page final repair.', issues: ['Not visual acceptance; final repair must resolve the retained component gate.'], evidence: [recoveryEvidence, ...measurements.map(m => m.evidence)] };
              completeTask(result, capsuleBuilder.sourceFiles(task));
              console.log(`${now()} DEFERRED ${key}; source recovery exhausted with full-page evidence retained`);
              return result;
            }
            if (stage === 'build' && task.mode === 'route-build' && attempt === maxTaskAttempts - 1) {
              state.deferredVisual ||= [];
              const failed = measurements.flatMap(measurement => measurement.sections.filter(section => !section.passed).map(section => section.id));
              state.deferredVisual.push({ id:`route-build:${task.routes[0]?.id || task.id}`,task:key,sections:failed,
                comparison:measurements.map(measurement=>measurement.evidence).join(', '),
                reason:'Complete route implementation finished its bounded Luna/Terra build turns. Fresh host measurements retain unresolved sections for full-page replanning; this is not visual acceptance.' });
              const routeResult={status:'passed',summary:'Complete route composition built; unresolved measured sections are handed to fresh full-page repair planning.',
                issues:failed.map(id=>`Measured route section still needs polish: ${id}`),evidence:measurements.map(measurement=>measurement.evidence)};
              completeTask(routeResult,[...capsule.filesToChange,...taskProgress.changed(filesBefore,taskProgress.implementationFiles())]);
              console.log(`${now()} ROUTE READY ${key}; ${failed.length} measured sections retained for full-page repair`);
              return routeResult;
            }
            if (routing.type === 'final-polish') {
              state.deferredVisual ||= [];
              state.deferredVisual.push({id:`sol-polish:${semanticHistory.key}`,task:key,sections:task.sections,
                comparison:measurements.map(measurement=>measurement.evidence).join(', '),
                reason:'The single route-level Sol polish completed; unresolved measured differences require human review or new source input.'});
              const polishResult={status:'passed',summary:'Single Sol route polish completed; host retained unresolved measured evidence for human review.',
                issues:['Not visual acceptance. No repeated Sol loop is permitted.'],evidence:measurements.map(measurement=>measurement.evidence)};
              completeTask(polishResult,[...capsule.filesToChange,...taskProgress.changed(filesBefore,taskProgress.implementationFiles())]);
              return polishResult;
            }
            continue;
          }
          if (['passed', 'needs_work'].includes(result.status) && routing.type !== 'final-polish') {
            // The host's fresh component gate is the authoritative runtime
            // acceptance. Workers can retain stale environment concerns (for
            // example an unserved pretty permalink) even when the resolver
            // measured the canonical native fallback successfully.
            if (result.status === 'needs_work') {
              result.status = 'passed';
              result.summary = `${result.summary} Host accepted the independently passed component gate; retained worker concerns are deferred to route/final QA.`;
              result.issues = (result.issues || []).filter(issue => !/canonical|rewrite|HTTP 404|Apache|nginx|host/i.test(String(issue)));
            }
            completeTask(result, [...capsule.filesToChange, ...taskProgress.changed(filesBefore, taskProgress.implementationFiles())]); return result;
          }
        }
        if (stage==='build' && (fullPageTask || !task.sections) && ['passed','needs_work'].includes(result.status)) {
          runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(attemptDir, 'build.log'));
          if(await deferBuild(path.join(attemptDir,'build-readiness'),result)) return result;
        }
        if (result.status === 'passed') {
          if (stage === 'discovery') runCommand(process.execPath, ['scripts/factory/autopilot/gates.js', ...(task.scope === 'inventory' ? ['inventory'] : task.scope === 'canvas-backfill' ? ['snapshot'] : ['group', task.buildGroup, ...(task.sections || [])])], path.join(attemptDir, 'gate.log'));
          if (['foundation', 'build', 'correct'].includes(stage)) {
            runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(attemptDir, 'build.log'));
          }
          if (stage === 'build' && (fullPageTask || !task.sections)) {
            for (const route of task.routes) {
              const verification = await require('./visual').captureAll({ output: path.join(attemptDir, `page-verification-${route.id}`), routeId: route.id, acceptanceScope: 'page' });
              if (!verification.pagePassed) throw new Error(`COMMAND_FAILED: page acceptance failed; inspect ${relative(path.join(attemptDir, `page-verification-${route.id}`, 'summary.json'))}`);
            }
          }
          completeTask(result, [...capsule.filesToChange, ...taskProgress.changed(filesBefore, taskProgress.implementationFiles())]);
          save(); console.log(`${now()} DONE ${key}`); return result;
        }
        save();
        if(routing.type==='final-audit')return result;
        if (result.status === 'blocked') {
          const deferred = deferBlockedScopedCorrection(result, record);
          if (deferred) return deferred;
          throw new Error(`WORKER_BLOCKED: ${result.summary}\n${result.issues.join('\n')}`);
        }
        if (stage === 'audit' && task.auditCheckpoint) return result;
        feedback = JSON.stringify(result);
      } catch (e) {
        record.status = 'failed'; record.error = e.message; record.finishedAt = now();
        if (e.execution) { record.threadId = e.execution.threadId; record.usage = e.execution.usage; record.usageUnknown = !e.execution.usage; }
        save();
        if (capacityFailure(record) && routing.alias !== 'luna' && !state.capacityFallbacks[key]) {
          state.capacityFallbacks[key] = { from: routing.alias, to: 'luna', attempt: relative(attemptDir), at: now() };
          task = { ...task, onlyModel: 'luna' };
          feedback = 'MODEL_CAPACITY_FALLBACK: the previous Terra call was unavailable before doing work. Continue the same scoped task with Luna; do not repeat source reads that are already in the capsule.';
          save();
          // Capacity failures are not billable task attempts. Reuse this loop
          // slot once for the fallback model instead of terminating the run.
          attempt--;
          continue;
        }
        // Infrastructure failures never trigger expensive blind agent retry loops.
        if (!e.message.startsWith('COMMAND_FAILED')) throw e;
        feedback = e.message;
      } finally {
        record.reviewGuardAfter={engine:engineFingerprint(),implementation:fingerprint(),source:state.snapshotHash?require('./visual').sourceHash():null,init:hash(fs.readFileSync(path.join(ROOT,'factory/project.json')))};
        save();
        const execution = fs.existsSync(path.join(attemptDir, 'execution.json')) ? read(path.join(attemptDir, 'execution.json')) : null;
        const row=telemetry.record(dir, { task: key, routing, usage: execution?.usage, status: record.status === 'passed' ? 'pass' : 'fail', dir: attemptDir, pricing: config.pricing });
        console.log(`${now()} USAGE ${key} model: ${row.model} effort: ${row.reasoningEffort} input: ${row.inputTokens??'unknown'} cached: ${row.cachedInputTokens??'unknown'} output: ${row.outputTokens??'unknown'} cost: ${row.cost??'unknown'} status: ${row.status}`);
      }
    }
    // The attempt budget may be exhausted *inside* this invocation (after
    // Luna and Terra), not only before the loop on a later resume. Apply the
    // same final-audit handoff here so a healthy component cannot pause the
    // entire autopilot merely because its residual raster mismatch is high.
    const exhaustedComponent = deferHealthyComponent() || deferExhaustedHealthyComponent();
    if (exhaustedComponent) return exhaustedComponent;
    const latestFullPageAttempt = billableAttempts().at(-1);
    const fullPageHandoff = fullPageTask && ['passed', 'needs_work'].includes(latestFullPageAttempt?.result?.status)
      ? require('./full-page-handoff').create(task, key, pageChecks)
      : null;
    if (fullPageHandoff) {
      state.deferredVisual ||= [];
      state.deferredVisual.push(fullPageHandoff.deferred);
      completeTask(fullPageHandoff.result, [...capsuleBuilder.sourceFiles(task), ...fullPageHandoff.result.evidence]);
      console.log(`${now()} FULL-PAGE HANDOFF ${key}; bounded build exhausted, retained measurements queued for whole-site diagnosis`);
      return fullPageHandoff.result;
    }
    throw new Error(`STAGE_ATTEMPTS_EXHAUSTED: ${key}\n${feedback}`);
  };
  const capture = async () => {
    checkpoint(); state.activeTask = 'capture'; state.activeModel = null; state.activeReasoningEffort = null; save();
    const target = path.join(dir, `comparison-${Date.now()}`);
    const { captureAll } = require('./visual');
    const result = await captureAll({ output: target });
    state.comparison = relative(path.join(target, 'summary.json')); save(); return result;
  };
  const onSignal = () => { fs.writeFileSync(stopFile, now()); terminate(activeChild); };
  process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
  try {
    save();
    runCommand(process.execPath, ['scripts/factory/validate-factory.js'], path.join(dir, 'preflight.log'));
    const { wp } = require('./wp');
    if (new URL(wp(['option', 'get', 'home'])).hostname !== new URL(resolveLocalUrl(project)).hostname) throw new Error('SITE_IDENTITY_MISMATCH');
    if (fs.existsSync(SNAPSHOT)) {
      const m = read(path.join(SNAPSHOT, 'manifest.json'));
      const expectedKey = require('../figma/utils').extractFigmaFileKey(project.figma.url);
      if (m.source.fileKey !== expectedKey) {
        // Preserve stale cache as history; no reset/delete and never feed another project's bytes to a worker.
        fs.renameSync(SNAPSHOT, path.join(path.dirname(SNAPSHOT), `archived-${Date.now()}`));
      }
    }
    if (!fs.existsSync(SNAPSHOT)) runCommand(process.execPath, ['scripts/factory/figma/prepare-snapshot.js'], path.join(dir, 'prepare.log'));
    const gates = require('./gates');
    const legacyManifest = read(path.join(SNAPSHOT, 'manifest.json'));
    const semanticBackfillKey='v2:discovery:semantic-route-backfill-v1';
    if (canvasAudit.validate(legacyManifest, '1.1').length && !state.done.includes(semanticBackfillKey)) {
      state.legacyCanvasBackfillFrom = state.snapshotHash || null;
      state.snapshotHash = null; state.snapshotHashVersion = null; save();
      await work('discovery', { id: 'semantic-route-backfill-v1', scope: 'canvas-backfill', type: 'source-extraction', routes: legacyManifest.routes,
        title: 'Backfill semantic route topology and reconcile omitted visible Figma content' }, '', true);
      const completion = gates.snapshot();
      write(path.join(dir, 'legacy-canvas-backfill-gate.json'), completion);
      if (!completion.passed) throw new Error(`SNAPSHOT_INCOMPLETE: ${completion.errors.join('; ')}`);
      // The backfill can introduce newly discovered detail tasks. Keep the
      // snapshot mutable until those source-only tasks have completed.
      state.snapshotHash = null; state.snapshotHashVersion = null; save();
    }
    if (!state.done.includes('discovery:inventory') && gates.inventory().passed) {
      write(path.join(dir, 'recovered-inventory-gate.json'), gates.inventory());
      state.done.push('discovery:inventory'); save();
    }
    await work('discovery', { id: 'inventory', scope: 'inventory', type: 'source-extraction' });
    const inventoryManifest = read(path.join(SNAPSHOT, 'manifest.json'));
    const routeDiscoveryTasks = require('./discovery-plan').plan(inventoryManifest);
    const pendingDiscovery = routeDiscoveryTasks
      .some(task => !state.done.includes(`v2:discovery:${task.id}`));
    if (pendingDiscovery && state.snapshotHash) {
      // A resumed discovery phase is allowed to persist missing source facts.
      // The hash is frozen only after the last complete-frame audit below.
      state.snapshotHash = null; state.snapshotHashVersion = null; save();
    }
    for (const task of routeDiscoveryTasks) await work('discovery', task);
    if (!state.snapshotHash && read(path.join(SNAPSHOT,'manifest.json')).status !== 'complete') {
      const merged = await require('./reconcile-discovery').reconcile(dir, true);
      console.log(`${now()} DISCOVERY MERGE: ${merged.changes.length} bookkeeping files, ${merged.facts.length} recorded node identities; no model call`);
    }
    const completion = gates.snapshot({ allowPartial: true });
    write(path.join(dir, 'snapshot-completion-gate.json'), completion);
    if (!completion.passed) throw new Error(`SNAPSHOT_INCOMPLETE: ${completion.errors.join('; ')}`);
    const completedManifest = read(path.join(SNAPSHOT, 'manifest.json'));
    if (completedManifest.status !== 'complete') { completedManifest.status = 'complete'; write(path.join(SNAPSHOT, 'manifest.json'), completedManifest); }
    runCommand(process.execPath, ['scripts/factory/autopilot/gates.js', 'snapshot'], path.join(dir, 'snapshot-gate.log'));
    const currentSnapshotHash = require('./visual').sourceHash();
    if (retainedSourceHash && retainedSourceHash !== currentSnapshotHash) throw Error('SOURCE_CHANGED_DURING_REUSE');
    if (state.snapshotHash && state.snapshotHash !== currentSnapshotHash) throw new Error('SNAPSHOT_CHANGED_SINCE_PREVIOUS_RUN');
    state.snapshotHash = currentSnapshotHash;
    state.snapshotHashVersion = 2;
    save();
    const manifest = read(path.join(SNAPSHOT, 'manifest.json'));
    runCommand(process.execPath,['scripts/factory/autopilot/state-plan.js'],path.join(dir,'state-plan.log'));
    // Freeze the complete cross-route architecture before implementation.
    // The plan explicitly separates shared structural patterns, canonical
    // pages and interaction-state deltas.
    const resolvedManifest = require('./source-geometry').resolveManifest();
    const registryFile=path.join(ROOT,'scripts/factory/project/component-registry.json');
    const componentRegistry=fs.existsSync(registryFile)?read(registryFile):[];
    const routeBlueprintFile=path.join(dir,'route-blueprints.json');
    const routeBlueprint=require('./route-blueprint').create(resolvedManifest,routeBlueprintFile,componentRegistry);
    state.routeBlueprints=relative(routeBlueprintFile);save();
    const componentPlan = require('./component-plan').plan(resolvedManifest, require('./state-plan').load(resolvedManifest),componentRegistry,routeBlueprint);
    write(path.join(dir, 'component-plan.json'), componentPlan);
    write(path.join(dir, 'execution-plan.json'), {
      version: 1,
      sourceHash: state.snapshotHash,
      order: ['foundation', 'native-content', 'shared-components', 'canonical-pages', 'interaction-state-deltas', 'whole-site-audit'],
      reusablePatterns: routeBlueprint.reusablePatterns,
      shared: componentPlan.shared.map(task=>task.id),
      pages: componentPlan.pages.map(task=>task.id),
      states: componentPlan.states.map(task=>({id:task.id,baseRoute:task.baseRoute,focusSections:task.sections,overlayOnly:task.stateDelta?.overlayOnly || false})),
    });
    await work('foundation', { id: 'global-layout', type: 'refactor', title: 'Global source fonts, grid, tokens and native route skeletons',
      topics: ['layout'], sections: [] });
    const contentTasks=require('./content-batches').plan(read(path.join(SNAPSHOT,'content-map.json')),manifest,config.contentBatchSize||3);
    write(path.join(dir,'content-batches.json'),contentTasks);
    for(const task of contentTasks)await work('foundation',task);
    // Each shared variant is independently built, measured and checkpointed before any page component.
    for (const component of componentPlan.shared) await work('foundation', component);
    write(path.join(dir, 'shared-ready.json'), { status: 'passed', tasks: componentPlan.shared.map(c => c.id),
      source: state.snapshotHash, acceptance: config.visual, note: 'Local component geometry/pixels; final page placement and responsive checks remain mandatory.' });
    // Canonical pages receive a fresh full-page gate one by one. A bounded
    // build miss is checkpointed for the later diagnosis loop, never accepted
    // or blindly rebuilt. State frames follow their implemented base page and
    // receive only their measured delta.
    for (const component of [...componentPlan.pages, ...componentPlan.states]) {
      if (!state.done.includes(`v2:build:${component.id}`)) {
        const routeId=component.routes[0]?.id;
        const contextDir=path.join(dir,`route-build-context-${hash(component.id).slice(0,16)}-${Date.now()}`);
        await require('./visual').captureAll({output:contextDir,routeId,responsive:false,acceptanceScope:'page'});
        component.comparison=relative(path.join(contextDir,'summary.json'));
      }
      await work('build', component);
    }
    const auditProgress = require('./audit-progress');
    const retainedAudit = auditProgress.resumeComparison(dir);
    let comparison;
    if (retainedAudit) {
      state.comparison = retainedAudit.file; save(); comparison = retainedAudit.value;
      console.log(`${now()} AUDIT RESUME: verified retained input snapshot; completed checkpoints preserved`);
    } else comparison = await capture();
    let audit;
    while (true) {
      // A deterministic full-page failure already contains measured route and
      // section deltas. Correct it before independent review; auditing every
      // section first only spends tokens to restate evidence the corrector
      // needs. Deferred component evidence remains available to diagnostics.
      if (comparison.passed) {
        const auditLedger = auditProgress.initialize(dir,state.comparison,state.round);
        for (const unit of auditProgress.status(auditLedger)) {
          checkpoint();
          if (!unit.pending.length) continue;
          while (auditProgress.status(auditLedger).find(u=>u.id===unit.id).pending.length) {
            const packet = auditProgress.packet(auditLedger,unit.id,1);
            const item = packet.pending[0];
            await work('audit', {id:`round-${state.round}-${packet.key}-${unit.id}-${item.id}`,comparison:state.comparison,
              type:item.kind==='native'?'native-content':'visual-review',
              routes:item.kind==='native'?[]:packet.unit.routes,auditSections:packet.pending.filter(i=>i.section).map(i=>i.section),auditMode:item.kind,auditCheckpoint:packet.file},'',true);
            if (auditProgress.status(auditLedger).find(u=>u.id===unit.id).pending.includes(item.id)) throw Error(`AUDIT_CHECKPOINT_INCOMPLETE: ${unit.id}/${item.id}; earlier items retained`);
          }
        }
        audit = auditProgress.aggregate(auditLedger);
        if (audit.status === 'passed' && comparison.passed) break;
      } else {
        audit = { status: 'needs_work', issues: [`Deterministic comparison failed: ${state.comparison}. Resolve its measured route/section/responsive failures before independent visual audit.`] };
      }
      checkpoint();
      if (state.round >= config.maxRepairPasses) {
        // A repair-round cap ends repeated scoped work; it is not a reason to
        // skip the one independent final audit. Preserve the measured
        // comparison and enter that audit, which can either make bounded
        // final CSS fixes or retain actionable human-review evidence. It may
        // never turn this unresolved comparison into a visual PASS.
        state.repairBudgetExhausted = { round: state.round, comparison: state.comparison, at: now() };
        save();
        console.log(`${now()} REPAIR BUDGET EXHAUSTED; forwarding retained measurements to final audit`);
        break;
      }
      state.round++; save();
      const before = fingerprint();
      const correctionRoutes = comparison.routes.filter(r=>!r.passed && !(state.sourceDependencies || []).some(d=>d.routeId===r.id)).map(r=>r.id);
      if (!correctionRoutes.length && state.sourceDependencies?.length) throw new Error('SOURCE_INPUT_REQUIRED: see retained source dependencies in REPORT.md; no fabricated content or visual PASS');
      const diagnoses = require('./diagnostics').diagnose(comparison.routes.map(r=>read(inside(ROOT,r.comparison))),config.visual.maxDifferentPixelRatio,resolvedManifest);
      write(path.join(dir, `diagnostics-${state.round}.json`), diagnoses);
      if (!diagnoses.length) {
        // Audit-only semantic findings still have a concrete per-route owner.
        for (const route of resolvedManifest.routes.filter(r=>correctionRoutes.length?correctionRoutes.includes(r.id):true)) diagnoses.push({id:`audit-${route.id}`,type:'template-fix',sections:[],routes:[route.id],reason:audit.issues.join('\n')});
      }
      const unavailable=diagnoses.filter(d=>d.type==='state-preparation');
      if(unavailable.length){
        write(path.join(dir,'state-preparation-plan.json'),unavailable);
        for(const diagnosis of unavailable)await work('correct',{...diagnosis,id:`prepare-${diagnosis.routes[0]}`,comparison:state.comparison});
        comparison=await capture();
        if(require('./diagnostics').diagnose(comparison.routes.map(r=>read(inside(ROOT,r.comparison))),config.visual.maxDifferentPixelRatio,resolvedManifest).some(d=>d.type==='state-preparation'))throw Error('STATE_UNAVAILABLE_AFTER_PREPARATION: no Terra CSS retry');
        continue;
      }
      for (const diagnosis of diagnoses) await work('correct', { id: `round-${state.round}-${diagnosis.id}`, comparison: state.comparison,
        class:diagnosis.class,type: diagnosis.type, sections: diagnosis.sections, routes: diagnosis.global ? diagnosis.routes.slice(0,1) : diagnosis.routes,
        diagnostic:diagnosis,component:diagnosis.component,affectedRoutes: diagnosis.routes, issues: [diagnosis.reason], title: diagnosis.reason });
      if (fingerprint() === before) {
        state.routeSolPolish ||= {};
        let invoked=false;
        for (const routeId of correctionRoutes) {
          if (state.routeSolPolish[routeId]) continue;
          const route=resolvedManifest.routes.find(item=>item.id===routeId);
          if(!route)continue;
          const sections=route.sections.filter(id=>require('./visual-ownership').sectionOwnership(resolvedManifest,id).owner==='page');
          state.routeSolPolish[routeId]={status:'started',comparison:state.comparison,at:now()};save();
          await work('correct',{id:`route-polish-${routeId}`,type:'final-polish',mode:'route-polish',routes:[route],sections,
            comparison:state.comparison,issues:['Scoped correction plan reached a no-progress plateau.'],title:`One full-page Sol polish: ${routeId}`,
            budget:{maxAttempts:1}},'',true);
          state.routeSolPolish[routeId]={status:'complete',comparison:state.comparison,at:now()};save();invoked=true;
        }
        if (fingerprint() === before) throw new Error(invoked
          ? 'HUMAN_REVIEW_REQUIRED: one route-level Sol polish completed without implementation progress; retained evidence is authoritative'
          : 'HUMAN_REVIEW_REQUIRED: semantic repair and route-level Sol budgets are exhausted; no repeated token loop');
        comparison=await capture();
        continue;
      }
      comparison = await capture();
    }
    const packetFile=path.join(dir,'final-review-packet.json');
    write(packetFile,{comparison:state.comparison,routes:comparison.routes,shared:componentPlan.shared.map(c=>({id:c.id,sections:c.sections})),audit: audit,
      instruction:'Follow one comparison/section pointer at a time; all raw images remain local. Shared variants are reviewed once. Missing state/source remains blocked.'});
    const invokeFinal=mode=>work('final',{id:'final-sol-once',type:'final-audit',mode,routes:[],sections:[],issues:[],title:'Final whole-project visual audit'},`Read ${relative(packetFile)}; this is the one final Sol audit.`);
    comparison=await require('./final-audit').run({dir,comparison,threshold:config.visual.maxDifferentPixelRatio,
      binding:hash(JSON.stringify({source:state.snapshotHash,instructionsHash,visual:config.visual})),
      invoke:invokeFinal,
      reconcile:async mode=>{
        const attempt=state.attempts.filter(a=>a.task==='v2:final:final-sol-once').at(-1);
        if(!attempt || !fs.existsSync(path.join(attempt.dir,'execution.json')))return null;
        const execution=read(path.join(attempt.dir,'execution.json'));
        if(execution.completed && !execution.failure && attempt.result && attempt.status!=='failed')return attempt.result;
        if(execution.completed && execution.failure?.message==='TASK_REPORTED_TOKEN_BUDGET' && attempt.reviewGuardBefore &&
          JSON.stringify(attempt.reviewGuardBefore)===JSON.stringify(attempt.reviewGuardAfter) &&
          attempt.reviewGuardAfter.implementation===fingerprint() && attempt.reviewGuardAfter.engine===engineFingerprint() &&
          fs.existsSync(path.join(attempt.dir,'result.json'))){
          const result=require('./result-evidence').normalize(read(path.join(attempt.dir,'result.json')),ROOT).result;
          const valid=new Ajv().compile(read(path.join(ROOT,'factory/schemas/autopilot-result.schema.json')));
          if(valid(result)&&result.evidence.every(f=>fs.existsSync(inside(ROOT,f)))){
            attempt.budgetOverrun=true;attempt.recoveredCompletedReview=true;save();return result;
          }
        }
        if(!execution.completed&&execution.threadId&&execution.startedModel==='gpt-5.6-sol')return invokeFinal(mode);
        return null;
      },
      repair:task=>work('correct',{...task,comparison:state.comparison,routes:comparison.routes.map(r=>r.id),sections:[]}),
      build:async()=>runCommand(process.execPath,['node_modules/webpack-cli/bin/cli.js','--mode=production'],path.join(dir,'final-build.log')),
      capture});
    if (!comparison.passed) throw Error('FINAL_POLISH_MEASURED_FAILURE: retain scoped task evidence; no false final PASS');
    if (fingerprint() !== comparison.implementationHash) throw new Error('IMPLEMENTATION_CHANGED_AFTER_CAPTURE');
    if (state.sourceDependencies?.length) throw new Error('SOURCE_INPUT_REQUIRED: dependencies need verified resolution before final acceptance');
    state.status = 'complete'; state.activeTask = null; state.activeModel = null; state.activeReasoningEffort = null; state.error = null; state.errorStack = null; save();
    console.log(`READY FOR HUMAN REVIEW: ${relative(path.join(dir, 'REPORT.md'))}`);
  } catch (e) {
    state.status = 'paused'; state.error = e.message; state.errorStack = e.stack || e.message; save(); process.exitCode = 1;
    console.error(`AUTOPILOT PAUSED: ${e.stack || e.message}\nReport: ${relative(path.join(dir, 'REPORT.md'))}`);
  } finally {
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (fs.existsSync(lockFile) && read(lockFile).pid === process.pid) fs.unlinkSync(lockFile);
  }
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { main, session, reconcileUsage };
