const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, files, read, write, hash, inside } = require('./common');
const custom = require('./custom-instructions');
const rel = f => path.relative(ROOT, f).replaceAll('\\', '/');
function sourceFiles(task, root = ROOT) {
  const specified = task.files || [];
  const ids = [...(task.sections || task.auditSections || []), task.component].filter(Boolean);
  const candidates = ['src', 'partials', 'functions', 'woocommerce', 'acf-json', 'scripts/factory/project'].flatMap(p => files(path.join(root, p)))
    .concat(fs.readdirSync(root).filter(p => p.endsWith('.php')).map(p => path.join(root, p)))
    .filter(f => /\.(scss|css|js|php|json)$/.test(f));
  const matched = ids.length ? candidates.filter(f => ids.some(id => fs.readFileSync(f, 'utf8').includes(id))) : [];
  const paths = [...new Set([...specified, ...matched.map(f => path.relative(root, f).replaceAll('\\', '/'))])];
  for (const p of paths) {
    inside(root, p);
    if (/^(scripts\/factory\/autopilot|factory\/|dist\/|\.git\/)/.test(p.replaceAll('\\', '/'))) throw Error(`PROTECTED_TASK_FILE: ${p}`);
  }
  return paths;
}
function excerpt(root, file, needles = [], maxBytes = 1400) {
  const f = inside(root, file);
  if (!fs.existsSync(f)) return { path: file, exists: false };
  if (fs.lstatSync(f).isSymbolicLink()) throw Error(`CAPSULE_SYMLINK: ${file}`);
  const bytes = fs.readFileSync(f), text = bytes.toString('utf8');
  const index = needles.map(n => text.indexOf(n)).find(i => i >= 0) ?? 0;
  const start = Math.max(0, index - 200);
  return { path: file, sha256: hash(bytes), characters: text.length, offset: start, text: text.slice(start, start + maxBytes), truncated: text.length > start + maxBytes };
}
function create({ stage, task, routing, dir, sourceContext, feedback = '', instructions = [] }) {
  const scopeFile = path.join(dir, 'source-context/scope.json');
  const scope = fs.existsSync(scopeFile) ? read(scopeFile) : {};
  const sections = task.sections || task.auditSections || [];
  const changes = sourceFiles({ ...task, sections });
  const comparisons = (task.measurements || []).map(m => ({ route: m.route, path: m.evidence, errors: m.errors,
    sections: (m.sections || []).map(s => ({ id: s.id, expected: s.expected, actual: s.actual || null, html: s.actual?.html || null,
      delta: s.actual && s.expected ? Object.fromEntries(['x','y','width','height'].map(k=>[k,s.actual[k]-s.expected[k]])) : null,
      ratio: s.pixels?.ratio ?? null })) }));
  if (task.comparison && fs.existsSync(inside(ROOT, task.comparison))) {
    const summary = read(inside(ROOT, task.comparison));
    for (const r of comparisons.length ? [] : summary.routes || []) {
      if (task.routes?.length && !task.routes.some(t => (typeof t === 'string' ? t : t.id) === r.id)) continue;
      if (r.comparison && fs.existsSync(inside(ROOT, r.comparison))) {
        const c = read(inside(ROOT, r.comparison));
        const metricPath = path.join(path.dirname(inside(ROOT, r.comparison)), 'metrics.json');
        const metrics = fs.existsSync(metricPath) ? read(metricPath) : {};
        comparisons.push({ route: r.id, path: r.comparison, errors: c.errors,
          sections: (c.geometry || []).filter(g => sections.includes(g.id)).map(g => ({ id: g.id, owner: g.owner, expected: g.expected,
            actual: g.actual, delta: g.delta, html: metrics.sections?.find(s => s.id === g.id)?.html || null,
            htmlAvailable: !!metrics.sections?.find(s => s.id === g.id)?.html, source: r.comparison })) });
      }
    }
  }
  const capsule = { version: 2, id: task.id, title: task.title || `${routing.type}: ${sections.join(', ') || task.id}`, type: routing.type,
    reuseComponent: task.reuseComponent || null,
    project: { localUrl: read(path.join(ROOT, 'factory/project.json')).environment.localUrl },
    operation: stage, filesToChange: changes, fileScope: changes.length ? 'listed files; request concrete scope expansion when a required file is absent' : 'scope discovery required; identify exact project file paths before editing',
    snippets: changes.slice(0, 5).map(f => excerpt(ROOT, f, sections)),
    sectionCount: (scope.sections || []).length,
    sections: (scope.sections || []).filter(s => sections.includes(s.id)).map(s => ({ id: s.id, snapshot: s.snapshot, records: s.records?.path })),
    routeCount: (scope.routes || []).length,
    routes: (scope.routes || []).slice(0, task.routes?.length ? task.routes.length : 1).map(r => ({ id: r.id, path: r.path, state: r.state, viewport: { width: r.width, height: 900 },
      sourceFrameHeight: r.height, expected: Object.fromEntries(Object.entries(r.sectionGeometry || {}).filter(([id]) => sections.includes(id))), reference: r.reference })),
    measurements: comparisons, sourceContext: sourceContext?.available ? sourceContext.index?.path : null,
    checkpoint: task.auditCheckpoint || null, feedback: String(feedback).slice(0, 4500), issues: task.issues || [],
    customInstructions: custom.select(instructions, [stage, routing.type, ...(task.topics || [])]),
    constraints: ['Only this project. No engine, reference, threshold or credential changes.', 'No whole source files or historical prompts/logs in context. Use bounded excerpts and exact JSON pointers.',
      'Null measurements mean unavailable, never zero or PASS. Capture the assigned section before editing if no current measurement exists.',
      'Source viewport width is the frame width, never the content/grid width. Active frames describe states of the canonical page.',
      'Return real file evidence. Save each completed fragment immediately. Never invent source content or claim a measurement not performed.'],
    budget: routing.budget };
  // Keep source metadata lossless on disk, but project only one task into the worker context.
  let serialized = JSON.stringify(capsule, null, 2);
  if (Buffer.byteLength(serialized) > routing.budget.maxPromptBytes) {
    capsule.snippets = []; // On-demand bounded excerpt requests remain possible.
    capsule.measurements = comparisons.map(c => ({ route: c.route, path: c.path, sections: c.sections.map(s => ({ id: s.id, expected: s.expected, actual: s.actual, delta: s.delta })) }));
    serialized = JSON.stringify(capsule, null, 2);
  }
  if (Buffer.byteLength(serialized) > routing.budget.maxPromptBytes) throw Error(`CAPSULE_TOO_LARGE: split task ${task.id}`);
  write(path.join(dir, 'task-capsule.json'), capsule);
  return capsule;
}
module.exports = { create, sourceFiles, excerpt };
