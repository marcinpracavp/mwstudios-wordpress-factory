const fs = require('fs');
const path = require('path');
const { ROOT, read, write, hash, inside, files } = require('./common');
function implementationFiles(root = ROOT) {
  const list = ['src', 'assets', 'acf-json', 'functions', 'partials', 'templates', 'woocommerce', 'scripts/factory/project'].flatMap(p => files(path.join(root, p)))
    .concat(fs.readdirSync(root).filter(p => p.endsWith('.php')).map(p => path.join(root, p)));
  return Object.fromEntries(list.map(f => [path.relative(root, f).replaceAll('\\', '/'), hash(fs.readFileSync(f))]));
}
function changed(before, after) { return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(f => before[f] !== after[f]); }
function fileFor(dir, id) { return path.join(dir, 'task-progress', `${hash(id).slice(0, 24)}.json`); }
function signatures(root, list) {
  return [...new Set(list)].map(f => { const p = inside(root, f); return { path: f, sha256: fs.existsSync(p) ? hash(fs.readFileSync(p)) : null }; });
}
function valid(dir, id, binding, root = ROOT) {
  const file = fileFor(dir, id);
  if (!fs.existsSync(file)) return false;
  const record = read(file);
  return record.status === 'passed' && record.binding === binding && record.evidence.length > 0 && record.evidence.every(e =>
    e.sha256 && fs.existsSync(inside(root, e.path)) && hash(fs.readFileSync(inside(root, e.path))) === e.sha256) && record.outputs.every(e =>
    (fs.existsSync(inside(root, e.path)) ? hash(fs.readFileSync(inside(root, e.path))) : null) === e.sha256);
}
function save(dir, id, binding, { evidence, outputs, result }, root = ROOT) {
  if (!evidence?.length) throw Error(`CHECKPOINT_EVIDENCE_REQUIRED: ${id}`);
  const file = fileFor(dir, id);
  if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.${Date.now()}.history`);
  const proof = signatures(root, evidence);
  if (proof.some(p => !p.sha256)) throw Error('CHECKPOINT_MISSING_EVIDENCE');
  write(file, { version: 1, id, binding, status: 'passed', evidence: proof, outputs: signatures(root, outputs || []), result, savedAt: new Date().toISOString() });
  return file;
}
function result(dir, id) {
  const file=fileFor(dir,id);
  return fs.existsSync(file) ? read(file).result : null;
}
module.exports = { valid, save, result, signatures, implementationFiles, changed };
