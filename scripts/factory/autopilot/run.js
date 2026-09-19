const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const Ajv = require('ajv');
const { ROOT, CACHE, SNAPSHOT, read, write, hash, inside, fingerprint, engineFingerprint, alive, resolveCodex } = require('./common');
const { routeTask, validateRouter, continuationThread } = require('./model-router');
const taskProgress = require('./task-progress');
const capsuleBuilder = require('./task-capsule');
const telemetry = require('./telemetry');
const { CONTEXT_VERSION, prepareContext, correctionFocus } = require('./source-context');
const { prompt } = require('./prompts');
const lockFile = path.join(CACHE, 'lock.json');
const currentFile = path.join(CACHE, 'current-v2.json'); // V1 run/checkpoints remain untouched.
const stopFile = path.join(CACHE, 'stop');
const now = () => new Date().toISOString();
const relative = f => path.relative(ROOT, f).replaceAll('\\', '/');
let activeChild = null;
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
  const wpContent = path.resolve(ROOT, '../..');
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
          if (observedBytes > routing.budget.remainingInputTokens || outputBytes > routing.budget.remainingOutputTokens * 4) {
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
    usage.input_tokens-(usage.cached_input_tokens || 0)>routing.budget.remainingUncachedInputTokens)) failure = { message: 'TASK_REPORTED_TOKEN_BUDGET' };
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
  for (const f of result.evidence) if (!fs.existsSync(inside(ROOT, f))) throw new Error(`MISSING_AGENT_EVIDENCE: ${f}`);
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
  const runSession = dependencies.session || session;
  const runCommand = dependencies.command || command;
  fs.mkdirSync(CACHE, { recursive: true });
  const mode = argv[0] || 'run';
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
  if (mode === 'stop') { fs.writeFileSync(stopFile, now()); return console.log('Stop requested. Current worker finishes; next stage will not launch.'); }
  const config = read(path.join(ROOT, 'factory/autopilot.json'));
  const modelPolicy = validateRouter(config);
  const customInstructions = require('./custom-instructions').load(ROOT);
  if (!Number.isInteger(config.toolOutputTokenLimit) || config.toolOutputTokenLimit < 512 || config.toolOutputTokenLimit > 6000) throw new Error('Invalid tool output limit: expected 512..6000');
  if (!Number.isInteger(config.maxRepairPasses) || config.maxRepairPasses < 1 || !Number.isInteger(config.maxStageAttempts) || config.maxStageAttempts < 1 || config.stageTimeoutMinutes < 1 || config.maxUncachedTokens < 1) throw new Error('Invalid autopilot limits');
  const project = read(path.join(ROOT, 'factory/project.json'));
  const configHash = hash(fs.readFileSync(path.join(ROOT, 'factory/project.json')));
  const executable = resolveCodex();
  if (mode === 'plan' || mode === 'check') {
    console.log(JSON.stringify({ executable, localUrl: project.environment.localUrl, source: project.figma.url,
      modelPolicy, stages: ['scoped discovery', 'global layout + native source content', 'shared component build + measured gate', 'page/state components', 'diagnosed scoped repairs', 'checkpointed audit', 'Sol final verification + polish', 'fresh final acceptance'], config }, null, 2));
    if (mode === 'check') {
      const { wp } = require('./wp');
      const actual = wp(['option', 'get', 'home']);
      if (new URL(actual).hostname !== new URL(project.environment.localUrl).hostname) throw new Error(`SITE_MISMATCH: runtime=${actual}`);
      console.log('Current LocalWP identity verified. No site content changed.');
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
  } else {
    if (fs.existsSync(currentFile) && read(read(currentFile).state).status !== 'complete') throw new Error('UNFINISHED_RUN: use resume; do not discard history');
    const id = `${now().replace(/[:.]/g, '-')}-${process.pid}`;
    dir = path.join(CACHE, 'runs', id);
    state = { id, projectHash: configHash, localUrl: project.environment.localUrl, status: 'running', done: [], attempts: [], tokens: 0, round: 0, createdAt: now() };
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
    const { comparison: _comparison, measurements: _measurements, ...stableTask } = task;
    const binding = hash(JSON.stringify({ task: stableTask, source: stage === 'discovery' ? state.projectHash : state.snapshotHash || state.projectHash, instructionsHash, visual: config.visual, version: 2 }));
    if (!force && taskProgress.valid(dir, key, binding)) return { status: 'passed', summary: 'Verified task checkpoint; artifacts retained', issues: [] };
    const completeTask = (result, outputs = []) => {
      taskProgress.save(dir, key, binding, { evidence: result.evidence, outputs, result });
      if (!state.done.includes(key)) state.done.push(key);
      save();
    };
    // A completed result can be validated without another paid attempt. Retain the overrun;
    // budget exhaustion prevents model retries, not deterministic inspection of existing work.
    const retained=state.attempts.filter(a=>a.task===key).at(-1);
    const retainedExecution=retained && fs.existsSync(path.join(retained.dir,'execution.json')) ? read(path.join(retained.dir,'execution.json')) : null;
    if (retainedExecution?.completed && retainedExecution.failure?.message==='TASK_REPORTED_TOKEN_BUDGET' &&
      ['foundation','build'].includes(stage) && fs.existsSync(path.join(retained.dir,'result.json'))) {
      const result=require('./result-evidence').normalize(read(path.join(retained.dir,'result.json')),ROOT).result;
      const validate=new Ajv().compile(read(path.join(ROOT,'factory/schemas/autopilot-result.schema.json')));
      if (validate(result) && result.status==='passed' && result.evidence.every(f=>fs.existsSync(inside(ROOT,f)))) {
        checkpoint();
        if (state.snapshotHash && require('./visual').sourceHash()!==state.snapshotHash) throw Error('FROZEN_SNAPSHOT_CHANGED');
        const recovery=path.join(dir,`retained-result-${hash(key).slice(0,16)}-${Date.now()}`);
        fs.mkdirSync(recovery,{recursive:true});
        const engineBefore=engineFingerprint();
        runCommand(process.execPath,['node_modules/webpack-cli/bin/cli.js','--mode=production'],path.join(recovery,'build.log'));
        const measurements=[];
        for(const route of task.sections?.length ? task.routes : []) measurements.push(await require('./component-visual').capture({route,sections:task.sections,
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
    if (stage === 'discovery' && !customInstructions.length && read(path.join(SNAPSHOT,'manifest.json')).status === 'complete') {
      const gate = task.scope === 'inventory' ? require('./gates').inventory() : require('./gates').group(task.buildGroup,task.sections || null);
      if (gate.passed) {
        const proof=path.join(dir,`retained-source-${hash(key).slice(0,16)}.json`);
        retainedSourceHash ||= require('./visual').sourceHash();
        write(proof,{gate,sourceHash:retainedSourceHash,scope:task.sections || 'inventory',note:'Validated complete local snapshot reused; no new Figma request or source review claimed.'});
        completeTask({status:'passed',summary:'Validated complete source cache retained',issues:[],evidence:[relative(proof)]});
        return;
      }
    }
    if (task.sections?.length && ['foundation','build','correct','final'].includes(stage)) {
      checkpoint();
      const measurements=[];
      for(const route of task.routes) measurements.push(await require('./component-visual').capture({route,sections:task.sections,
        output:path.join(dir,`precheck-${hash(key).slice(0,16)}-${Date.now()}`,typeof route==='string'?route:route.id)}));
      if (['foundation','build'].includes(stage) && measurements.every(m=>m.passed)) {
        const result={status:'passed',summary:'Existing component independently measured; no worker needed',issues:[],evidence:measurements.map(m=>m.evidence)};
        completeTask(result,capsuleBuilder.sourceFiles(task));
        console.log(`${now()} REUSED ${key}; fresh component gate passed without model tokens`);
        return result;
      }
      task={...task,measurements};
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
      if(!checks.every(c=>c.buildReady || dependencyPolicy.carryable(c,declaredDependencies.find(d=>d.routeId===c.routes[0]?.id)))) return false;
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
    if(stage==='build' && !task.sections && state.attempts.some(a=>a.task===key)) {
      checkpoint();
      runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(dir, 'resume-build.log'));
      if(await deferBuild(path.join(dir,`resume-page-check-${Date.now()}`),state.attempts.filter(a=>a.task===key).at(-1)?.result)) return {status:'needs_work',summary:'Build handoff ready; final audit owns deferred visual findings and missing-source dependencies',issues:[]};
    }
    for (let attempt = 0; attempt < config.taskBudgets.maxAttempts; attempt++) {
      checkpoint();
      state.activeTask = key; state.status = 'running'; state.error = null;
      const routing = routeTask(config, task, state.attempts.filter(a => a.task === key));
      const model = routing.model;
      state.activeModel = model; state.activeReasoningEffort = routing.reasoningEffort;
      const attemptDir = path.join(dir, `${String(state.attempts.length + 1).padStart(3, '0')}-${stage}-${task.id}`);
      const previous = state.attempts.filter(a => a.task === key).at(-1);
      const previousExecution = previous && fs.existsSync(path.join(previous.dir, 'execution.json')) ? read(path.join(previous.dir, 'execution.json')) : null;
      // A budget pause must not discard the completed worker's remaining-issues handoff.
      if (!feedback && previous?.result?.status === 'needs_work') feedback = JSON.stringify(previous.result);
      const repairResult = /^(MISSING_AGENT_EVIDENCE|INVALID_AGENT_RESULT):/.test(previous?.error || '');
      const previousLaunchFile = previous && path.join(previous.dir, 'launch.json');
      const previousLaunch = previousLaunchFile && fs.existsSync(previousLaunchFile) ? read(previousLaunchFile) : null;
      const contextCompatible = previousLaunch?.contextPolicyVersion === CONTEXT_VERSION && previousLaunch?.toolOutputTokenLimit === config.toolOutputTokenLimit;
      const resumeThreadId = contextCompatible && !task.auditCheckpoint ? continuationThread(previousExecution, model, repairResult) : null;
      if (repairResult) feedback = `Your previous turn completed but its result failed validation: ${previous.error}. Fix only the result/evidence contract. Do not repeat completed source reads or implementation. Evidence entries must be existing theme-relative FILE paths, never commands or explanations. Save any missing gate output to a real file, then return the corrected schema response.`;
      if (stage === 'discovery') {
        for (const a of state.attempts.filter(a => a.task === key)) await require('./observations').recover(path.join(a.dir, 'events.jsonl'));
      }
      const currentGate = stage === 'discovery' ? (task.scope === 'inventory' ? require('./gates').inventory() : require('./gates').group(task.buildGroup, task.sections || null)) : null;
      let focusedTask = stage==='build' && pageChecks.length ? {...task,routes:task.routes.filter(r=>{
        const check = pageChecks.find(c=>c.routes[0]?.id===r.id);
        return !check?.buildReady && !(check && require('./source-dependencies').carryable(check,declaredDependencies.find(d=>d.routeId===r.id)));
      })} : task;
      if(stage==='build' && !task.sections) {
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
        plans: ['PLAN.md', 'STATUS.md', 'SOURCE_CLARIFICATIONS.md', 'REUSABLE_COMPONENTS.md'].map(f => `docs/factory/project/${f}`).filter(f => fs.existsSync(path.join(ROOT, f))),
        currentGate,
        instruction: currentGate?.passed ? 'The current structural gate already passes. Verify source completeness only for this assigned group, finish its documentation and return. Do not repeat completed discovery.' : 'Inspect the current gate and finish only remaining assigned work. Reuse real saved source facts and assets.'
      });
      const record = { task: key, model, modelAlias: routing.alias, taskType: routing.type, reasoningEffort: routing.reasoningEffort, dir: attemptDir, status: 'running', startedAt: now() };
      state.attempts.push(record); save();
      console.log(`${now()} START ${key} [${model} ${routing.reasoningEffort}] (${relative(attemptDir)})`);
      const engine = engineFingerprint();
      const implementationBefore = fingerprint();
      const filesBefore = taskProgress.implementationFiles();
      try {
        const execution = await runSession({ executable: executable.file, config, stage, task:focusedTask, dir: attemptDir, feedback, resumeThreadId, routing,
          onChild: pid => { lock.childPid = pid; write(lockFile, lock); } });
        lock.childPid = null; write(lockFile, lock);
        const u = execution.usage || {};
        record.usage = u; record.threadId = execution.threadId; record.finishedAt = now();
        if (engineFingerprint() !== engine) throw new Error('ENGINE_CHANGED_BY_WORKER: review before continuing');
        if (state.snapshotHash && require('./visual').sourceHash() !== state.snapshotHash) throw new Error('FROZEN_SNAPSHOT_CHANGED: original design evidence must remain immutable');
        if (['audit', 'final'].includes(stage) && routing.type !== 'final-polish' && fingerprint() !== implementationBefore) throw new Error('REVIEWER_CHANGED_IMPLEMENTATION');
        if (hash(fs.readFileSync(path.join(ROOT, 'factory/project.json'))) !== configHash) throw new Error('INIT_CHANGED_BY_WORKER');
        const result = execution.result;
        record.result = result; record.status = result.status;
        if (task.sections?.length && ['foundation', 'build', 'correct', 'final'].includes(stage) && ['passed', 'needs_work'].includes(result.status)) {
          runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(attemptDir, 'build.log'));
          const measurements = [];
          for (const route of task.routes) measurements.push(await require('./component-visual').capture({ route, sections: task.sections, output: path.join(attemptDir, `component-${typeof route === 'string' ? route : route.id}`) }));
          write(path.join(attemptDir, 'component-gate.json'), { passed: measurements.every(m => m.passed), measurements });
          result.evidence.push(relative(path.join(attemptDir, 'component-gate.json')));
          if (!measurements.every(m => m.passed)) {
            task = { ...task, measurements };
            record.status = 'needs_work'; feedback = JSON.stringify(measurements.map(m => ({ evidence: m.evidence, errors: m.errors, sections: m.sections.map(s => ({ id: s.id, passed: s.passed, expected: s.expected, actual: s.actual, ratio: s.pixels?.ratio })) })));
            save(); continue;
          }
          if (result.status === 'passed' && routing.type !== 'final-polish') {
            completeTask(result, [...capsule.filesToChange, ...taskProgress.changed(filesBefore, taskProgress.implementationFiles())]); return result;
          }
        }
        if (stage==='build' && !task.sections && ['passed','needs_work'].includes(result.status)) {
          runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(attemptDir, 'build.log'));
          if(await deferBuild(path.join(attemptDir,'build-readiness'),result)) return result;
        }
        if (result.status === 'passed') {
          // Final polish always reaches Sol; ordinary solved tasks stop at Luna.
          if (routing.type === 'final-polish' && routing.alias !== 'sol') { feedback = 'Cheaper verification complete. Perform the next bounded final verification/polish.'; save(); continue; }
          if (stage === 'discovery') runCommand(process.execPath, ['scripts/factory/autopilot/gates.js', ...(task.scope === 'inventory' ? ['inventory'] : ['group', task.buildGroup, ...(task.sections || [])])], path.join(attemptDir, 'gate.log'));
          if (['foundation', 'build', 'correct'].includes(stage)) {
            runCommand(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--mode=production'], path.join(attemptDir, 'build.log'));
          }
          if (stage === 'build' && !task.sections) {
            for (const route of task.routes) {
              const verification = await require('./visual').captureAll({ output: path.join(attemptDir, `page-verification-${route.id}`), routeId: route.id, acceptanceScope: 'page' });
              if (!verification.pagePassed) throw new Error(`COMMAND_FAILED: page acceptance failed; inspect ${relative(path.join(attemptDir, `page-verification-${route.id}`, 'summary.json'))}`);
            }
          }
          completeTask(result, [...capsule.filesToChange, ...taskProgress.changed(filesBefore, taskProgress.implementationFiles())]);
          save(); console.log(`${now()} DONE ${key}`); return result;
        }
        save();
        if (result.status === 'blocked') throw new Error(`WORKER_BLOCKED: ${result.summary}\n${result.issues.join('\n')}`);
        if (stage === 'audit' && task.auditCheckpoint) return result;
        feedback = JSON.stringify(result);
      } catch (e) {
        record.status = 'failed'; record.error = e.message; record.finishedAt = now();
        if (e.execution) { record.threadId = e.execution.threadId; record.usage = e.execution.usage; record.usageUnknown = !e.execution.usage; }
        save();
        // Infrastructure failures never trigger expensive blind agent retry loops.
        if (!e.message.startsWith('COMMAND_FAILED')) throw e;
        feedback = e.message;
      } finally {
        const execution = fs.existsSync(path.join(attemptDir, 'execution.json')) ? read(path.join(attemptDir, 'execution.json')) : null;
        telemetry.record(dir, { task: key, routing, usage: execution?.usage, status: record.status === 'passed' ? 'pass' : 'fail', dir: attemptDir, pricing: config.pricing });
      }
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
    if (new URL(wp(['option', 'get', 'home'])).hostname !== new URL(project.environment.localUrl).hostname) throw new Error('SITE_IDENTITY_MISMATCH');
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
    if (!state.done.includes('discovery:inventory') && gates.inventory().passed) {
      write(path.join(dir, 'recovered-inventory-gate.json'), gates.inventory());
      state.done.push('discovery:inventory'); save();
    }
    await work('discovery', { id: 'inventory', scope: 'inventory', type: 'source-extraction' });
    const inventoryManifest = read(path.join(SNAPSHOT, 'manifest.json'));
    const discoveryGroups = [...new Set(inventoryManifest.routes.map(r => r.buildGroup))];
    // Start with home/shared elements, then preserve source group order. No project-specific IDs.
    discoveryGroups.sort((a, b) => Number(inventoryManifest.routes.some(r => r.buildGroup === b && r.path === '/')) - Number(inventoryManifest.routes.some(r => r.buildGroup === a && r.path === '/')));
    const discovered = new Set();
    for (const buildGroup of discoveryGroups) {
      const routes = inventoryManifest.routes.filter(r => r.buildGroup === buildGroup);
      for (const section of [...new Set(routes.flatMap(r=>r.sections))]) {
        if (discovered.has(section)) continue;
        discovered.add(section);
        await work('discovery', { id: `detail-${hash(section).slice(0,16)}`, scope: 'group', type: 'source-extraction', buildGroup,
          sections: [section], routes: routes.filter(r=>r.sections.includes(section)) });
      }
    }
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
    state.snapshotHash = currentSnapshotHash; save();
    const manifest = read(path.join(SNAPSHOT, 'manifest.json'));
    runCommand(process.execPath,['scripts/factory/autopilot/state-plan.js'],path.join(dir,'state-plan.log'));
    await work('foundation', { id: 'global-layout', type: 'refactor', title: 'Global source fonts, grid, tokens and native route skeletons',
      topics: ['layout'], sections: [] });
    await work('foundation', { id: 'native-content', type: 'native-content', title: 'Import all source products, categories, tags, variations and editable source content before reuse', sections: [] });
    const resolvedManifest = require('./source-geometry').resolveManifest();
    const registryFile=path.join(ROOT,'scripts/factory/project/component-registry.json');
    const componentPlan = require('./component-plan').plan(resolvedManifest, require('./state-plan').load(resolvedManifest),fs.existsSync(registryFile)?read(registryFile):[]);
    write(path.join(dir, 'component-plan.json'), componentPlan);
    // Each shared variant is independently built, measured and checkpointed before any page component.
    for (const component of componentPlan.shared) await work('foundation', component);
    write(path.join(dir, 'shared-ready.json'), { status: 'passed', tasks: componentPlan.shared.map(c => c.id),
      source: state.snapshotHash, acceptance: config.visual, note: 'Local component geometry/pixels; final page placement and responsive checks remain mandatory.' });
    for (const component of componentPlan.pages) await work('build', component);
    const auditProgress = require('./audit-progress');
    const retainedAudit = auditProgress.resumeComparison(dir);
    let comparison;
    if (retainedAudit) {
      state.comparison = retainedAudit.file; save(); comparison = retainedAudit.value;
      console.log(`${now()} AUDIT RESUME: verified retained input snapshot; completed checkpoints preserved`);
    } else comparison = await capture();
    let audit;
    while (true) {
      if (comparison.passed || (state.deferredVisual?.length && state.round===0)) {
        const auditLedger = auditProgress.initialize(dir,state.comparison,state.round);
        for (const unit of auditProgress.status(auditLedger)) {
          checkpoint();
          if (!unit.pending.length) continue;
          while (auditProgress.status(auditLedger).find(u=>u.id===unit.id).pending.length) {
            const packet = auditProgress.packet(auditLedger,unit.id,1);
            const item = packet.pending[0];
            await work('audit', {id:`round-${state.round}-${packet.key}-${unit.id}-${item.id}`,comparison:state.comparison,
              type:item.kind==='native'?'native-content':'visual-review',
              routes:item.kind==='native'?[]:packet.unit.routes,auditSections:packet.pending.filter(i=>i.section).map(i=>i.section),auditCheckpoint:packet.file},'',true);
            if (auditProgress.status(auditLedger).find(u=>u.id===unit.id).pending.includes(item.id)) throw Error(`AUDIT_CHECKPOINT_INCOMPLETE: ${unit.id}/${item.id}; earlier items retained`);
          }
        }
        audit = auditProgress.aggregate(auditLedger);
        if (audit.status === 'passed' && comparison.passed) break;
      } else {
        audit = { status: 'needs_work', issues: [`Deterministic comparison failed: ${state.comparison}. Resolve its measured route/section/responsive failures before independent visual audit.`] };
      }
      checkpoint();
      if (state.round >= config.maxRepairPasses) throw new Error('VISUAL_REPAIR_BUDGET_EXHAUSTED: inspect measured differences; no false PASS');
      state.round++; save();
      const before = fingerprint();
      const correctionRoutes = comparison.routes.filter(r=>!r.passed && !(state.sourceDependencies || []).some(d=>d.routeId===r.id)).map(r=>r.id);
      if (!correctionRoutes.length && state.sourceDependencies?.length) throw new Error('SOURCE_INPUT_REQUIRED: see retained source dependencies in REPORT.md; no fabricated content or visual PASS');
      const diagnoses = require('./diagnostics').diagnose(comparison.routes.filter(r=>correctionRoutes.includes(r.id)).map(r=>read(inside(ROOT,r.comparison))),config.visual.maxDifferentPixelRatio);
      write(path.join(dir, `diagnostics-${state.round}.json`), diagnoses);
      if (!diagnoses.length) {
        // Audit-only semantic findings still have a concrete per-route owner.
        for (const route of resolvedManifest.routes.filter(r=>correctionRoutes.length?correctionRoutes.includes(r.id):true)) diagnoses.push({id:`audit-${route.id}`,type:'template-fix',sections:[],routes:[route.id],reason:audit.issues.join('\n')});
      }
      for (const diagnosis of diagnoses) await work('correct', { id: `round-${state.round}-${diagnosis.id}`, comparison: state.comparison,
        type: diagnosis.type, sections: diagnosis.sections, routes: diagnosis.global ? diagnosis.routes.slice(0,1) : diagnosis.routes,
        affectedRoutes: diagnosis.routes, issues: [diagnosis.reason], title: diagnosis.reason });
      if (fingerprint() === before) throw new Error('NO_IMPLEMENTATION_PROGRESS: corrections did not change source/build; stopping repeated consumption');
      comparison = await capture();
    }
    // Ultimate review/polish stays with Sol; no automatic return to Terra after Sol findings.
    for (const component of [...componentPlan.shared, ...componentPlan.pages]) await work('final', {
      ...component, id: `polish-${component.id}`, type: 'final-polish', comparison: state.comparison,
      title: `Final visual verification and safe polish: ${component.component}` });
    comparison = await capture();
    if (!comparison.passed) throw Error('FINAL_POLISH_MEASURED_FAILURE: retain scoped task evidence; no false final PASS');
    if (fingerprint() !== comparison.implementationHash) throw new Error('IMPLEMENTATION_CHANGED_AFTER_CAPTURE');
    if (state.sourceDependencies?.length) throw new Error('SOURCE_INPUT_REQUIRED: dependencies need verified resolution before final acceptance');
    state.status = 'complete'; state.activeTask = null; state.activeModel = null; state.activeReasoningEffort = null; state.error = null; save();
    console.log(`READY FOR HUMAN REVIEW: ${relative(path.join(dir, 'REPORT.md'))}`);
  } catch (e) {
    state.status = 'paused'; state.error = e.message; save(); process.exitCode = 1;
    console.error(`AUTOPILOT PAUSED: ${e.message}\nReport: ${relative(path.join(dir, 'REPORT.md'))}`);
  } finally {
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (fs.existsSync(lockFile) && read(lockFile).pid === process.pid) fs.unlinkSync(lockFile);
  }
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { main, session, reconcileUsage };
