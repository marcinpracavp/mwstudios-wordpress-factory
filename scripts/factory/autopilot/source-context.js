// Deterministic, lossless task projections. Original source files remain authoritative.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, inside, read, write, hash } = require('./common');
const CONTEXT_VERSION = 6;
const relative = f => path.relative(ROOT, f).replaceAll('\\', '/');
const descriptor = f => ({ path: relative(f), bytes: fs.statSync(f).size, sha256: hash(fs.readFileSync(f)) });

function prepareContext(stage, task, dir) {
  const manifestFile = path.join(SNAPSHOT, 'manifest.json');
  if (!fs.existsSync(manifestFile)) return { version: CONTEXT_VERSION, available: false };
  const m = require('./source-geometry').resolveManifest();
  const group = task.buildGroup || (stage === 'build' ? task.id : null);
  const requestedRoutes = new Set((task.routes || []).map(r => typeof r === 'string' ? r : r.id));
  const routes = (m.routes || []).filter(r => (!group || r.buildGroup===group) && (!requestedRoutes.size || requestedRoutes.has(r.id)));
  const plan=require('./state-plan').load(m);
  const stateFamilies=routes.map(r=>require('./state-plan').routePlan(plan,r.id)).filter(Boolean);
  const sectionIds = new Set(routes.flatMap(r => {
    const state=stateFamilies.find(s=>s.route===r.id);
    if(Array.isArray(task.auditSections)) return r.sections.filter(id=>task.auditSections.includes(id));
    return state?.baseRoute!==r.id && state ? state.focusSections : r.sections;
  }));
  const sections = (m.sections || []).filter(s => sectionIds.has(s.id));
  const nodeIds = new Set(routes.map(r => r.frameNodeId).concat(sections.flatMap(s => [s.desktopNodeId, s.mobileNodeId].filter(Boolean))));
  const contextDir = path.join(dir, 'source-context');
  const sources = [descriptor(manifestFile)];
  const contentFile = path.join(SNAPSHOT, 'content-map.json');
  const content = fs.existsSync(contentFile) ? read(contentFile) : { fields: [] };
  if (fs.existsSync(contentFile)) sources.push(descriptor(contentFile));
  const sectionIndex = [];
  for (const id of sectionIds) {
    const section = sections.find(s => s.id === id);
    const fields = (content.fields || []).filter(f => f.section === id);
    const output = path.join(contextDir, `section-${hash(id).slice(0, 16)}.json`);
    write(output, { id, manifestRecord: section || null, contentFields: fields });
    sectionIndex.push({ id, manifestRecordPresent: !!section, snapshot: section?.snapshot ? relative(inside(SNAPSHOT, section.snapshot)) : null, contentRecords: fields.length, records: descriptor(output) });
  }
  const observationFile = path.join(SNAPSHOT, 'observations/index.json');
  const observations = fs.existsSync(observationFile) ? read(observationFile) : [];
  if (fs.existsSync(observationFile)) sources.push(descriptor(observationFile));
  const matchingObservations = observations.filter(o => !group && !requestedRoutes.size || (o.nodeIds || []).some(id => nodeIds.has(id)) || group && (o.description || '').toLowerCase().includes(group.toLowerCase()));
  const scopeFile = path.join(contextDir, 'scope.json');
  write(scopeFile, { source: m.source, status: m.status, routes, stateFamilies, sections: sectionIndex, observations: matchingObservations,
    frames: (m.frames || []).filter(f => nodeIds.has(f.nodeId)),
    globalFiles: ['design-system.json', 'components.json'].map(f => path.join(SNAPSHOT, f)).filter(f => fs.existsSync(f)).map(descriptor),
    lookup: 'Observation matches are an index, not a completeness claim. Use targeted rg or inspect JSON pointers for missing node IDs. Never dump the full source files.' });
  const indexFile = path.join(contextDir, 'index.json');
  const index = { version: CONTEXT_VERSION, stage, group, routes: routes.map(r => ({ id: r.id, frameNodeId: r.frameNodeId })),
    sectionCount: sectionIndex.length, contentRecordCount: sectionIndex.reduce((n, s) => n + s.contentRecords, 0),
    relevantObservationCount: matchingObservations.length, sourceFiles: sources, scope: descriptor(scopeFile),
    read: `node scripts/factory/autopilot/source-context.js inspect ${relative(scopeFile)} /sections`,
    rule: 'Read this index first, then one section record and source snapshot at a time. Do not print full manifest/content-map/observation index. All source bytes remain on disk.' };
  write(indexFile, index);
  return { version: CONTEXT_VERSION, available: true, index: descriptor(indexFile) };
}

function correctionFocus(result) {
  const comparisons = [];
  const evidenceFiles = new Set(result?.evidence || []);
  for (const file of [...evidenceFiles]) {
    if (!file.endsWith('/summary.json')) continue;
    const target = inside(ROOT,file);
    if (fs.existsSync(target)) for (const route of read(target).routes || []) if (route.comparison) evidenceFiles.add(route.comparison);
  }
  for (const file of evidenceFiles) {
    if (!file.endsWith('/comparison.json')) continue;
    const target = inside(ROOT, file);
    if (!fs.existsSync(target)) continue;
    const comparison = read(target);
    if (!comparison.pixels?.crops || !comparison.geometry) continue;
    const sections = comparison.pixels.crops.filter(crop=>crop.owner==='page'&&!crop.reused).map(crop => {
      const geometry = comparison.geometry.find(g => g.id === crop.id);
      const box = geometry?.expected;
      return { id: crop.id, pixelMismatch: crop.ratio, geometryPassed: geometry?.passed, geometryDelta:geometry?.delta,
        approximateDifferentPixels: box ? Math.round(Math.round(box.width) * Math.round(box.height) * crop.ratio) : null };
    }).sort((a, b) => (b.approximateDifferentPixels || 0) - (a.approximateDifferentPixels || 0));
    comparisons.push({ evidence: descriptor(target), route: comparison.id, capturedAt: comparison.capturedAt,
      ownership: comparison.pixels.ownership || null,
      fullMismatch: comparison.pixels.ratio, sections,
      instruction: 'Historical priority only: confirm current screenshots first. Start with the section contributing the most different pixels, inspect its exact pair/crops and internal element typography/borders/images, then correct and recapture. Passing outer geometry does not prove matching inner content. Nested section counts overlap; do not sum them. Keep source references and acceptance thresholds unchanged.' });
  }
  return comparisons;
}

function inspect(file, pointer = '', offset = 0) {
  const target = inside(ROOT, file);
  let value = read(target);
  if (pointer && !pointer.startsWith('/')) throw new Error('JSON pointer must start with /');
  for (const part of pointer.split('/').slice(1)) {
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) throw new Error(`Missing JSON pointer: ${pointer}`);
    value = value[key];
  }
  if (!Number.isInteger(offset) || offset < 0) throw new Error('Invalid character offset');
  const serialized = JSON.stringify(value, null, 2);
  const limit = 6000;
  return { path: relative(target), pointer, offset, totalCharacters: serialized.length,
    nextOffset: offset + limit < serialized.length ? offset + limit : null,
    keys: offset === 0 && value && typeof value === 'object' ? Object.keys(value).slice(0, 40) : undefined,
    text: serialized.slice(offset, offset + limit),
    guidance: serialized.length > limit ? 'Partial view. Select a narrower JSON pointer or use nextOffset; never infer omitted facts.' : undefined };
}
if (require.main === module) {
  try {
    if (process.argv[2] !== 'inspect') throw new Error('Usage: source-context.js inspect <theme-relative-json> [JSON-pointer] [character-offset]');
    console.log(JSON.stringify(inspect(process.argv[3], process.argv[4] || '', Number(process.argv[5] || 0))));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { CONTEXT_VERSION, prepareContext, inspect, correctionFocus };
