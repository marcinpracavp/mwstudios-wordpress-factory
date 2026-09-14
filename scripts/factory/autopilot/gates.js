const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, read, inside, hash } = require('./common');
const { validateSnapshot } = require('../figma/validate-snapshot');
const { extractFigmaFileKey } = require('../figma/utils');
const Ajv = require('ajv');
function pngInfo(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not a PNG: ${file}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), sha256: hash(bytes) };
}
function inventory() {
  const errors = [];
  const m = read(path.join(SNAPSHOT, 'manifest.json'));
  const p = read(path.join(ROOT, 'factory/project.json'));
  const valid = new Ajv({ allErrors: true, strict: true }).compile(read(path.join(ROOT, 'factory/schemas/figma-snapshot.schema.json')));
  if (!valid(m)) errors.push(...valid.errors.map(e => `${e.instancePath}: ${e.message}`));
  if (m.source?.fileKey !== extractFigmaFileKey(p.figma.url)) errors.push('Wrong source file');
  if (!m.pages?.length || !m.frames?.length || !m.routes?.length || !m.productionFrames?.length) errors.push('Incomplete global inventory');
  const routeIds = new Set();
  for (const r of m.routes || []) {
    if (routeIds.has(r.id)) errors.push(`Duplicate route ${r.id}`);
    routeIds.add(r.id);
    try {
      const info = pngInfo(inside(SNAPSHOT, r.reference));
      if (info.width !== r.width || info.height !== r.height) errors.push(`Wrong 1x reference size ${r.id}`);
    } catch(e) { errors.push(e.message); }
  }
  for (const f of m.productionFrames || []) if (['production', 'state'].includes(f.classification) && !m.routes?.some(r => r.frameNodeId === f.nodeId)) errors.push(`Unmapped frame ${f.nodeId}`);
  return { passed: !errors.length, errors, routes: m.routes?.length };
}
function group(id) {
  const errors = [], m = read(path.join(SNAPSHOT, 'manifest.json'));
  const routes = m.routes.filter(r => r.buildGroup === id);
  if (!routes.length) errors.push(`Unknown buildGroup ${id}`);
  const valid = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true }).compile(read(path.join(ROOT, 'factory/schemas/figma-section.schema.json')));
  for (const id of [...new Set(routes.flatMap(r => r.sections))]) {
    const entry = m.sections.find(s => s.id === id);
    if (!entry) { errors.push(`Missing section ${id}`); continue; }
    try {
      const s = read(inside(SNAPSHOT, entry.snapshot));
      if (!valid(s)) errors.push(`Invalid section ${id}: ${JSON.stringify(valid.errors)}`);
      if (s.liveFigmaRequired) errors.push(`Missing visual source facts ${id}`);
      pngInfo(inside(SNAPSHOT, entry.desktopReference));
      for (const a of s.assets || []) if (!a.sourceNodeId || !a.path || !fs.statSync(inside(SNAPSHOT, a.path)).size) errors.push(`Missing asset ${id}`);
    } catch(e) { errors.push(e.message); }
  }
  return { passed: !errors.length, errors, group: id };
}
function snapshot({ allowPartial = false } = {}) {
  const result = validateSnapshot({ allowPartial });
  const errors = [...result.errors], m = result.manifest;
  if (!m) return { passed: false, errors };
  const p = read(path.join(ROOT, 'factory/project.json'));
  if (m.source.fileKey !== extractFigmaFileKey(p.figma.url)) errors.push('Snapshot belongs to another Figma project');
  if (!m.sections.length || !m.pages.length) errors.push('Empty snapshot inventory');
  if (!Array.isArray(m.routes) || !m.routes.length) errors.push('Missing executable route/state plan');
  const ids = new Set();
  for (const r of m.routes || []) {
    if (ids.has(r.id)) errors.push(`Duplicate route ${r.id}`);
    ids.add(r.id);
    if (!p.wordpress.languages.includes(r.language)) errors.push(`Unconfigured language ${r.language}`);
    if (!m.frames.some(f => f.nodeId === r.frameNodeId)) errors.push(`Unknown route source frame ${r.id}`);
    try {
      const info = pngInfo(inside(SNAPSHOT, r.reference));
      if (info.width !== r.width || info.height !== r.height) errors.push(`Reference must be exact 1x frame dimensions: ${r.id} ${JSON.stringify(info)}`);
    } catch (e) { errors.push(e.message); }
    for (const s of r.sections || []) {
      if (!m.sections.some(section => section.id === s)) errors.push(`Unknown section ${r.id}/${s}`);
    }
  }
  const classified = m.productionFrames || [];
  if (!classified.length) errors.push('Missing productionFrames classification inventory');
  for (const frame of classified) {
    if (['production', 'state'].includes(frame.classification) && !m.routes?.some(r => r.frameNodeId === frame.nodeId)) errors.push(`Uncovered production frame/state ${frame.nodeId}`);
  }
  for (const section of m.sections) {
    try {
      const s = read(inside(SNAPSHOT, section.snapshot));
      if (s.liveFigmaRequired) errors.push(`Unresolved source properties: ${s.id}`);
      if (![s.desktop.x, s.desktop.y, s.desktop.width, s.desktop.height].every(Number.isFinite)) errors.push(`Missing measured section geometry: ${s.id}`);
      pngInfo(inside(SNAPSHOT, section.desktopReference));
      for (const asset of s.assets || []) {
        if (!asset.sourceNodeId || !asset.path) { errors.push(`Asset missing source identity or local path: ${s.id}`); continue; }
        if (!fs.statSync(inside(SNAPSHOT, asset.path)).size) errors.push(`Empty asset: ${asset.path}`);
      }
    } catch (e) { errors.push(e.message); }
  }
  try {
    const map = read(path.join(SNAPSHOT, 'content-map.json'));
    if (!Array.isArray(map.fields) || !map.fields.length) errors.push('content-map.fields must contain actual sourced content');
    for (const f of map.fields || []) {
      if (!f.nodeId || !f.fieldName || !f.section || !f.language || !Object.hasOwn(f, 'value')) errors.push('Content record missing source/destination/language/value');
      if (!m.sections.some(s => s.id === f.section)) errors.push(`Unknown content section ${f.section}`);
    }
  } catch (e) { errors.push(e.message); }
  if (!fs.existsSync(path.join(ROOT, 'docs/factory/project/PLAN.md'))) errors.push('Missing implementation plan');
  return { passed: errors.length === 0, errors, routes: m.routes?.length, sections: m.sections.length };
}
if (require.main === module) {
  try {
    const result = process.argv[2] === 'inventory' ? inventory() : process.argv[2] === 'group' ? group(process.argv[3]) : snapshot();
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.passed ? 0 : 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { snapshot, inventory, group, pngInfo };
