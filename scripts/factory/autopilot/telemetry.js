const fs = require('fs');
const path = require('path');
const { write } = require('./common');
function entry({ task, routing, usage, status, dir, pricing = {} }) {
  const known = usage && ['input_tokens', 'output_tokens'].every(k => Number.isFinite(usage[k]));
  const rate = pricing[routing.alias];
  const priced = known && rate?.source && ['input', 'cachedInput', 'output'].every(k => Number.isFinite(rate[k]) && rate[k] >= 0);
  const cached = known ? usage.cached_input_tokens || 0 : null;
  return { version: 1, task, model: routing.alias, modelId: routing.model, reasoningEffort: routing.reasoningEffort, status,
    inputTokens: known ? usage.input_tokens : null, cachedInputTokens: cached, outputTokens: known ? usage.output_tokens : null,
    usageComplete: !!known, cost: priced ? ((usage.input_tokens - cached) * rate.input + cached * rate.cachedInput + usage.output_tokens * rate.output) / 1e6 : null,
    currency: priced ? 'USD' : null, costKind: priced ? 'configured-estimate' : 'unknown', pricingSource: priced ? rate.source : null,
    attemptDirectory: dir, recordedAt: new Date().toISOString() };
}
function record(runDir, args) {
  const row = entry(args);
  write(path.join(args.dir, 'usage.json'), row);
  // Rebuild from attempt records, making restart/reconciliation idempotent.
  const rows = fs.readdirSync(runDir, { withFileTypes: true }).filter(d => d.isDirectory())
    .map(d => path.join(runDir, d.name, 'usage.json')).filter(f => fs.existsSync(f)).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  fs.writeFileSync(path.join(runDir, 'usage.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  write(path.join(runDir, 'usage-summary.json'), { sessions: rows.length, unknownUsage: rows.filter(r => !r.usageComplete).length,
    knownEstimatedCost: rows.reduce((n, r) => n + (r.cost || 0), 0), unknownCost: rows.filter(r => r.cost === null).length,
    byModel: Object.fromEntries(['luna', 'terra', 'sol'].map(m => [m, { sessions: rows.filter(r => r.model === m).length,
      inputTokens: rows.filter(r => r.model === m).reduce((n, r) => n + (r.inputTokens || 0), 0), outputTokens: rows.filter(r => r.model === m).reduce((n, r) => n + (r.outputTokens || 0), 0) }])) });
  return row;
}
module.exports = { entry, record };
