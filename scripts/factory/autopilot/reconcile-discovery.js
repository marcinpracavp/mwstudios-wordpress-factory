// Merge discovery bookkeeping from existing source evidence; never infer design facts.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, read, write, inside, files, hash, jsonlLines } = require('./common');
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const decode = text => text.replace(/&(amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (match, entity) => {
  const fixed = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return fixed[entity] ?? (entity.startsWith('#x') ? String.fromCodePoint(parseInt(entity.slice(2), 16)) : entity.startsWith('#') ? String.fromCodePoint(Number(entity.slice(1))) : match);
});

async function plan(runDir) {
  const manifestFile = path.join(SNAPSHOT, 'manifest.json');
  const manifest = read(manifestFile);
  if (manifest.status !== 'partial') throw new Error('DISCOVERY_RECONCILIATION_REQUIRES_PARTIAL_SNAPSHOT');
  const sections = manifest.sections.map(entry => ({ entry, file: inside(SNAPSHOT, entry.snapshot), snapshot: read(inside(SNAPSHOT, entry.snapshot)) }));
  const seen = new Set();
  for (const { entry, snapshot } of sections) {
    if (seen.has(entry.id) || snapshot.id !== entry.id) throw new Error(`AMBIGUOUS_SECTION_ID: ${entry.id}`);
    seen.add(entry.id);
    for (const key of ['pageId', 'desktopNodeId', 'mobileNodeId']) {
      if (entry[key] && entry[key] !== snapshot.source?.[key]) throw new Error(`SOURCE_IDENTITY_CONFLICT: ${entry.id}/${key}`);
    }
    if (!manifest.pages.some(p => p.id === snapshot.source?.pageId)) throw new Error(`UNKNOWN_SOURCE_PAGE: ${entry.id}`);
  }
  const missing = new Set(sections.flatMap(({ snapshot }) => [snapshot.source.desktopNodeId, snapshot.source.mobileNodeId].filter(id => id && !manifest.frames.some(f => f.nodeId === id))));
  const facts = new Map();
  function collect(value, evidence) {
    if (!value || typeof value !== 'object') return;
    const id = value.id || value.nodeId;
    if (missing.has(id) && value.name && value.type) {
      const fact = { nodeId: id, name: value.name, type: value.type, evidence };
      const prior = facts.get(id);
      if (prior && (prior.name !== fact.name || prior.type !== fact.type)) throw new Error(`CONFLICTING_NODE_FACTS: ${id}`);
      facts.set(id, fact);
    }
    for (const nested of Object.values(value)) if (typeof nested === 'object') collect(nested, evidence);
  }
  for (const file of files(path.join(SNAPSHOT, 'observations')).filter(f => f.endsWith('.json'))) {
    collect(read(file), { file: relative(file), sha256: hash(fs.readFileSync(file)) });
  }
  // Recover exact metadata tag/name from successful logged responses when no structured observation exists.
  for (const file of files(runDir).filter(f => path.basename(f) === 'events.jsonl')) {
    if ([...missing].every(id => facts.has(id))) break;
    let lineNumber = 0;
    for await (const line of jsonlLines(file)) {
      lineNumber++;
      let event;
      try { event = JSON.parse(line); } catch { continue; }
      const item = event.item;
      if (event.type !== 'item.completed' || !item?.tool?.endsWith('get_metadata') || item.error || item.result?.isError) continue;
      if (item.arguments?.fileKey && item.arguments.fileKey !== manifest.source.fileKey) continue;
      for (const block of item.result?.content || []) {
        if (block.type !== 'text') continue;
        for (const match of block.text.matchAll(/<([\w-]+)\b([^<>]*)>/g)) {
          const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], decode(a[2])]));
          if (!missing.has(attrs.id) || facts.has(attrs.id) || !attrs.name) continue;
          facts.set(attrs.id, { nodeId: attrs.id, name: attrs.name, type: match[1], evidence: { file: relative(file), line: lineNumber, sha256: hash(line), format: 'original metadata XML tag' } });
        }
      }
    }
  }
  const unresolved = [...missing].filter(id => !facts.has(id));
  if (unresolved.length) throw new Error(`MISSING_RECORDED_NODE_FACTS: ${unresolved.join(', ')}`);
  const changes = [];
  const stage = (file, value) => {
    const before = fs.readFileSync(file);
    if (JSON.stringify(read(file)) !== JSON.stringify(value)) changes.push({ file, before, after: Buffer.from(JSON.stringify(value, null, 2) + '\n') });
  };
  sections.forEach(({ entry, snapshot, file }, index) => {
    if (!entry.name) entry.name = snapshot.name;
    for (const key of ['pageId', 'desktopNodeId', 'mobileNodeId']) if (!entry[key] && snapshot.source[key]) entry[key] = snapshot.source[key];
    entry.order = index + 1; snapshot.order = index + 1;
    for (const key of ['desktopNodeId', 'mobileNodeId']) {
      const id = snapshot.source[key];
      if (!id || manifest.frames.some(f => f.nodeId === id)) continue;
      const fact = facts.get(id);
      manifest.frames.push({ nodeId: id, name: fact.name, type: fact.type, pageId: snapshot.source.pageId });
    }
    stage(file, snapshot);
  });
  stage(manifestFile, manifest);
  return { changes, facts: [...facts.values()], sections: sections.length };
}

async function reconcile(runDir, apply = false) {
  const result = await plan(runDir);
  const evidence = { applied: apply, sections: result.sections, facts: result.facts, changes: result.changes.map(c => ({ file: relative(c.file), before: hash(c.before), after: hash(c.after) })) };
  if (apply && result.changes.length) {
    const evidenceDir = path.join(runDir, `discovery-reconciliation-${Date.now()}`);
    for (const change of result.changes) {
      if (hash(fs.readFileSync(change.file)) !== hash(change.before)) throw new Error('DISCOVERY_CHANGED_DURING_RECONCILIATION');
      const backup = path.join(evidenceDir, 'before', path.relative(SNAPSHOT, change.file));
      fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.writeFileSync(backup, change.before);
    }
    write(path.join(evidenceDir, 'plan.json'), evidence);
    for (const change of result.changes) {
      const temp = `${change.file}.${process.pid}.tmp`;
      fs.writeFileSync(temp, change.after); fs.renameSync(temp, change.file);
    }
    write(path.join(evidenceDir, 'completed.json'), evidence);
  }
  return evidence;
}
module.exports = { plan, reconcile };
