const fs = require('fs');
const path = require('path');
const { read, hash } = require('./common');

const ids = values => [...new Set((values || []).map(value => typeof value === 'string' ? value : value.id).filter(Boolean))].sort();
function scope(task) { return { routes: ids(task.routes), sections: ids(task.sections) }; }
function key(task) { return hash(JSON.stringify(scope(task))).slice(0, 20); }
function isSemanticRepair(task = {}) {
  const text = [task.title, task.diagnostic?.reason, ...(task.issues || [])].filter(Boolean).join('\n');
  return /(?:SEMANTIC_SECTION_INCOMPLETE|UNREGISTERED_SECTION)/.test(text);
}
function capsule(attempt) {
  const file = path.join(attempt.dir, 'task-capsule.json');
  return fs.existsSync(file) ? read(file) : null;
}
function forTask(state, task) {
  const wanted = key(task), attempts = [];
  for (const attempt of state.attempts || []) {
    const saved = capsule(attempt);
    if (!saved || key({ routes: saved.routes, sections: saved.focusSections || saved.sections }) !== wanted) continue;
    attempts.push(attempt);
  }
  return {
    key: wanted, attempts,
    repair: attempts.filter(attempt => attempt.taskType !== 'source-extraction' && attempt.taskType !== 'final-polish'),
    source: attempts.filter(attempt => attempt.taskType === 'source-extraction'),
    sol: attempts.filter(attempt => attempt.taskType === 'final-polish'),
  };
}
module.exports = { scope, key, forTask, isSemanticRepair };
