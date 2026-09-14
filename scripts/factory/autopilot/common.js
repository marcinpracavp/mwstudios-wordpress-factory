const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const CACHE = path.join(ROOT, '.factory-cache/autopilot');
const SNAPSHOT = path.join(ROOT, '.factory-cache/figma/latest');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temp, file);
}
function inside(root, relative) {
  if (typeof relative !== 'string' || !relative) throw new Error('Missing artifact path');
  const file = path.resolve(root, relative);
  const rel = path.relative(root, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Artifact outside root: ${relative}`);
  return file;
}
function files(root, exclude = new Set()) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(e => {
    if (exclude.has(e.name) || e.isSymbolicLink()) return [];
    const f = path.join(root, e.name);
    return e.isDirectory() ? files(f, exclude) : [f];
  });
}
function fingerprint(root = ROOT, selection = ['src', 'assets', 'acf-json', 'functions', 'partials', 'dist', 'templates', 'woocommerce', 'scripts/factory/project']) {
  const list = selection.flatMap(p => files(path.join(root, p)));
  list.push(...fs.readdirSync(root).filter(p => p.endsWith('.php')).map(p => path.join(root, p)));
  return hash(list.sort().map(f => `${path.relative(root, f)}:${hash(fs.readFileSync(f))}`).join('\n'));
}
function engineFingerprint() {
  return hash(['scripts/factory/autopilot', 'factory/schemas'].flatMap(p => files(path.join(ROOT, p)))
    .concat([path.join(ROOT, 'factory/autopilot.json'), path.join(ROOT, 'scripts/factory/figma/validate-snapshot.js')])
    .concat(fs.existsSync(path.join(CACHE, 'source-geometry.json')) ? [path.join(CACHE, 'source-geometry.json')] : [])
    .concat([path.join(CACHE,'state-plan.json'),path.join(ROOT,'docs/factory/COMMERCE_AND_ICONS.md')].filter(f=>fs.existsSync(f)))
    .sort().map(f => `${path.relative(ROOT, f)}:${hash(fs.readFileSync(f))}`).join('\n'));
}
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}
function resolveCodex() {
  const explicit = process.env.FACTORY_CODEX_PATH;
  const command = process.platform === 'win32' ? 'where.exe' : 'which';
  const candidates = explicit ? [explicit] : ['codex.exe', 'codex'].flatMap(name => {
    const r = spawnSync(command, [name], { encoding: 'utf8', windowsHide: true });
    return r.status === 0 ? r.stdout.trim().split(/\r?\n/).filter(f => !/\.(cmd|ps1|bat)$/i.test(f)) : [];
  });
  const found = [...new Set(candidates)].filter(f => fs.existsSync(f)).map(file => {
    const r = spawnSync(file, ['--version'], { encoding: 'utf8', windowsHide: true });
    return { file, version: (r.stdout || '').match(/\d+\.\d+\.\d+/)?.[0], ok: r.status === 0 };
  }).filter(x => x.ok && x.version);
  found.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  if (!found.length) throw new Error('CODEX_UNAVAILABLE: set FACTORY_CODEX_PATH to a native Codex executable.');
  return found[0];
}
async function* jsonlLines(file) {
  let buffer = '';
  for await (const chunk of fs.createReadStream(file, { encoding: 'utf8' })) {
    buffer += chunk;
    let split;
    while ((split = buffer.indexOf('\n')) !== -1) {
      yield buffer.slice(0, split);
      buffer = buffer.slice(split + 1);
    }
  }
  if (buffer.length) yield buffer;
}
module.exports = { ROOT, CACHE, SNAPSHOT, read, write, hash, inside, files, fingerprint, engineFingerprint, alive, resolveCodex, jsonlLines };
