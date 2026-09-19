// Routing is a property of a bounded task, never of its pipeline stage.
const MODELS = { luna: 'gpt-5.6-luna', terra: 'gpt-5.6-terra', sol: 'gpt-5.6-sol' };
const TYPES = ['source-extraction', 'component-build', 'native-content', 'style-fix', 'template-fix', 'interaction', 'refactor', 'visual-review', 'final-polish'];
function classifyTask(task) {
  if (task.type) {
    if (!TYPES.includes(task.type)) throw Error(`UNKNOWN_TASK_TYPE: ${task.type}`);
    return task.type;
  }
  const extensions = (task.files || []).map(f => String(f).split('.').pop());
  if (extensions.length && extensions.every(x => ['css', 'scss'].includes(x))) return 'style-fix';
  if (extensions.length <= 2 && extensions.length && extensions.every(x => ['php', 'css', 'scss'].includes(x))) return 'template-fix';
  return 'refactor'; // Unknown scope cannot be classified as a cheap CSS repair.
}
function validateRouter(config) {
  const c = config.taskBudgets;
  for (const k of ['maxInputTokens', 'maxOutputTokens', 'maxAttempts', 'maxPromptBytes']) {
    if (!Number.isSafeInteger(c?.[k]) || c[k] < 1) throw Error(`INVALID_TASK_BUDGET: ${k}`);
  }
  if (c.maxAttempts < 3) throw Error('TASK_ATTEMPTS_MUST_ALLOW_LUNA_TERRA_SOL');
  return { models: MODELS, types: TYPES, first: 'luna', budgets: c };
}
function routeTask(config, task, attempts = []) {
  validateRouter(config);
  const type = classifyTask(task);
  // A capacity interruption retries the same model; it is not evidence Luna failed the task.
  const useful = attempts.filter(a => a.result || /^COMMAND_FAILED/.test(a.error || ''));
  const name = a => a?.modelAlias || Object.keys(MODELS).find(k=>MODELS[k]===a?.model);
  const lastUseful=useful.at(-1), lastModel=name(lastUseful);
  let alias='luna';
  if(lastModel==='luna' && lastUseful.status!=='passed')alias='terra';
  // Every new escalation is preceded by a bounded Luna attempt. Terra does not blindly retry itself.
  if(type==='final-polish') {
    if(lastModel==='sol')alias='sol'; // Once Sol owns final polish, it keeps the remaining work.
    else if(lastModel==='luna' && (lastUseful.status==='passed' || useful.some(a=>name(a)==='terra')))alias='sol';
  }
  const last = attempts.at(-1);
  if (last && !last.result && !/^COMMAND_FAILED/.test(last.error || '')) alias = last.modelAlias || Object.keys(MODELS).find(k => MODELS[k] === last.model) || alias;
  const charged = attempts.filter(a => a.result || /^(COMMAND_FAILED|TASK_)/.test(a.error || ''));
  if (charged.length >= config.taskBudgets.maxAttempts) throw Error(`TASK_ATTEMPTS_EXHAUSTED: ${task.id}`);
  const usage = attempts.reduce((n, a) => ({ input: n.input + (a.usage?.input_tokens || 0), output: n.output + (a.usage?.output_tokens || 0),
    uncached: n.uncached + Math.max(0,(a.usage?.input_tokens || 0)-(a.usage?.cached_input_tokens || 0)) }), { input: 0, output: 0, uncached: 0 });
  const maxUncached = config.taskBudgets.maxUncachedInputTokens || config.taskBudgets.maxInputTokens;
  if (usage.input >= config.taskBudgets.maxInputTokens || usage.uncached >= maxUncached || usage.output >= config.taskBudgets.maxOutputTokens) throw Error(`TASK_TOKEN_BUDGET_REACHED: ${task.id}`);
  return { model: MODELS[alias], alias, type, reasoningEffort: alias === 'luna' && !useful.length && ['style-fix', 'template-fix'].includes(type) ? 'medium' : 'high',
    budget: { ...config.taskBudgets, remainingInputTokens: config.taskBudgets.maxInputTokens - usage.input, remainingUncachedInputTokens: maxUncached - usage.uncached, remainingOutputTokens: config.taskBudgets.maxOutputTokens - usage.output } };
}
function continuationThread() { return null; } // Small, durable capsules replace growing conversation history.
module.exports = { MODELS, TYPES, classifyTask, validateRouter, routeTask, continuationThread };
