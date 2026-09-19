const fs = require('fs');
const path = require('path');
const { hash, write } = require('./common');
function load(root) {
  const result = [];
  for (const name of ['custom-instructions.md', 'custom-instructions.json']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    if (fs.lstatSync(file).isSymbolicLink()) throw Error('CUSTOM_INSTRUCTIONS_SYMLINK');
    const raw = fs.readFileSync(file);
    if (raw.length > 16000) throw Error(`CUSTOM_INSTRUCTIONS_TOO_LARGE: ${name}; split JSON into task topics`);
    const value = name.endsWith('.json') ? JSON.parse(raw.toString('utf8').replace(/^\uFEFF/, '')) : raw.toString('utf8');
    if (typeof value !== 'string' && (!value || Array.isArray(value) || typeof value !== 'object')) throw Error(`INVALID_CUSTOM_INSTRUCTIONS: ${name}`);
    result.push({ path: name, sha256: hash(raw), value });
  }
  return result;
}
function select(records, topics) {
  return records.map(r => ({ path: r.path, sha256: r.sha256, text: typeof r.value === 'string' ? r.value :
    ['all', ...new Set(topics)].filter(k => Object.hasOwn(r.value, k)).map(k => `${k}: ${typeof r.value[k] === 'string' ? r.value[k] : JSON.stringify(r.value[k])}`).join('\n') })).filter(r => r.text);
}
function snapshot(root, file) { const records = load(root); write(file, { version: 1, records }); return records; }
module.exports = { load, select, snapshot };
