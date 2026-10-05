const fs = require('fs');
const path = require('path');
const { resolveLocalUrl, ROOT, SNAPSHOT, files, read, write, hash, inside } = require('./common');
const custom = require('./custom-instructions');
const rel = f => path.relative(ROOT, f).replaceAll('\\', '/');
function sourceFiles(task, root = ROOT) {
  const specified = task.files || [];
  const ids = [...(task.sections || task.auditSections || []), task.component].filter(Boolean);
  const candidates = ['src', 'partials', 'functions', 'woocommerce', 'acf-json', 'scripts/factory/project'].flatMap(p => files(path.join(root, p)))
    .concat(fs.readdirSync(root).filter(p => p.endsWith('.php')).map(p => path.join(root, p)))
    .filter(f => /\.(scss|css|js|php|json)$/.test(f));
  const matched = ids.length && !task.contentKeys ? candidates.filter(f => ids.some(id => fs.readFileSync(f, 'utf8').includes(id))) : [];
  const implementationPaths = [...new Set([...specified, ...matched.map(f => path.relative(root, f).replaceAll('\\', '/'))])];
  // Discovery can add a section after the project's registry was written. A
  // new route section has no textual match yet, but its first implementation
  // still needs the route composition, a scoped stylesheet and the component
  // barrel. Give it this bounded, conventional fallback instead of a
  // documentation-only capsule that can only report a scope blockage.
  const generatedComponentFiles = !task.contentKeys && task.type === 'component-build' && ids.length && !implementationPaths.length
    ? [...new Set([
      ...(task.routes || []).some(route => (typeof route === 'string' ? route : route.id) === 'home') ? ['front-page.php'] : [],
      ...(fs.existsSync(path.join(root, 'partials/route-skeleton.php')) ? ['partials/route-skeleton.php'] : []),
      ...ids.map(id => `src/css/components/_${id}.scss`),
      ...(fs.existsSync(path.join(root, 'src/css/components/_index.scss')) ? ['src/css/components/_index.scss'] : []),
    ])]
    : [];
  const paths = [...new Set([...implementationPaths, ...generatedComponentFiles])];
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
function selectBlueprints(allRouteBlueprints, task) {
  const selectedRouteIds = new Set([
    ...(task.routes || []).map(route => typeof route === 'string' ? route : route.id),
    ...(task.baseRoute ? [task.baseRoute] : []),
  ]);
  return {
    selectedRouteIds,
    routeBlueprints: {
      routes: (allRouteBlueprints.routes || []).filter(route => !selectedRouteIds.size || selectedRouteIds.has(route.id)),
      reusablePatterns: (allRouteBlueprints.reusablePatterns || []).filter(pattern =>
        pattern.uses?.some(use => selectedRouteIds.has(use.route))),
    },
  };
}
function create({ stage, task, routing, dir, sourceContext, feedback = '', instructions = [] }) {
  const scopeFile = path.join(dir, 'source-context/scope.json');
  const scope = fs.existsSync(scopeFile) ? read(scopeFile) : {};
  const sections = task.sections || task.auditSections || [];
  const sourceIndexFile = path.join(dir, 'source-context/index.json');
  const sourceIndex = fs.existsSync(sourceIndexFile) ? read(sourceIndexFile) : {};
  const blueprintFile = sourceIndex.routeBlueprints?.path ? inside(ROOT, sourceIndex.routeBlueprints.path) : null;
  const allRouteBlueprints = blueprintFile && fs.existsSync(blueprintFile) ? read(blueprintFile) : { routes: [], reusablePatterns: [] };
  const {selectedRouteIds,routeBlueprints}=selectBlueprints(allRouteBlueprints,task);
  const changes = sourceFiles({ ...task, sections });
  const comparisons = (task.measurements || []).map(m => ({ route: m.route, path: m.evidence, errors: m.errors,
    sections: (m.sections || []).map(s => ({ id: s.id, expected: s.expected, actual: s.actual || null, html: s.actual?.html || null,
      delta: s.actual && s.expected ? Object.fromEntries(['x','y','width','height'].map(k=>[k,s.actual[k]-s.expected[k]])) : null,
      ratio: s.pixels?.layoutRatio ?? s.pixels?.ratio ?? null })) }));
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
  const fullPageEvidence = [];
  if (task.comparison && fs.existsSync(inside(ROOT, task.comparison))) {
    const summary = read(inside(ROOT, task.comparison));
    for (const route of summary.routes || []) {
      if (task.routes?.length && !task.routes.some(item => (typeof item === 'string' ? item : item.id) === route.id)) continue;
      if (!route.comparison || !fs.existsSync(inside(ROOT, route.comparison))) continue;
      const comparison = read(inside(ROOT, route.comparison));
      const diff = path.join(path.dirname(inside(ROOT, route.comparison)), 'diff.png');
      fullPageEvidence.push({ route: route.id, comparison: route.comparison,
        reference: comparison.reference?.path || routeBlueprints.routes.find(item => item.id === route.id)?.fullPageReference || null,
        rendered: comparison.rendered?.path || null, diff: fs.existsSync(diff) ? path.relative(ROOT, diff).replaceAll('\\', '/') : null,
        passed: comparison.passed, errors: comparison.errors || [], pixelRatio: comparison.pixels?.ratio ?? null,
        semantic: comparison.semantic || null });
    }
  }
  const capsule = { version: 3, id: task.id, class:task.class || routing.type, title: task.title || `${routing.type}: ${sections.join(', ') || task.id}`, type: routing.type,
    contentRecords:task.contentRecords || [],contentKeys:task.contentKeys || [],batchInstructions:task.instructions || null,mode:task.mode || null,
    baseRoute: task.baseRoute || null, stateDelta: task.stateDelta || null,
    diagnostic:task.diagnostic || null,
    reuseComponent: task.reuseComponent || null,
    reuseComponents: task.reuseComponents || (task.reuseComponent ? [task.reuseComponent] : []),
    project: { localUrl: resolveLocalUrl(read(path.join(ROOT, 'factory/project.json'))) },
    operation: stage, filesToChange: changes, fileScope: changes.length ? 'listed files; request concrete scope expansion when a required file is absent' : 'scope discovery required; identify exact project file paths before editing',
    snippets: changes.slice(0, 5).map(f => excerpt(ROOT, f, sections)),
    sectionCount: (scope.sections || []).length,
    sections: (scope.sections || []).filter(s => sections.includes(s.id)).map(s => ({ id: s.id, snapshot: s.snapshot, records: s.records?.path })),
    routeCount: (scope.routes || []).length,
    routes: (scope.routes || []).filter(route => !selectedRouteIds.size || selectedRouteIds.has(route.id)).map(r => ({ id: r.id, path: r.path, state: r.state, viewport: { width: r.width, height: 900 },
      sourceFrameHeight: r.height, expected: Object.fromEntries(Object.entries(r.sectionGeometry || {}).filter(([id]) => sections.includes(id))), reference: r.reference })),
    routeBlueprints: routeBlueprints.routes,
    reusableRoutePatterns: routeBlueprints.reusablePatterns,
    fullPageEvidence,
    focusSections: sections,
    measurements: comparisons, sourceContext: sourceContext?.available ? sourceContext.index?.path : null,
    checkpoint: task.auditCheckpoint || null, auditMode: task.auditMode || null, feedback: String(feedback).slice(0, 4500), issues: task.issues || [],
    customInstructions: custom.select(instructions, [stage, routing.type, task.class, ...(task.topics || [])].filter(Boolean)),
    constraints: ['Only this project. No engine, reference, threshold or credential changes.', 'No whole source files or historical prompts/logs in context. Use bounded excerpts and exact JSON pointers.',
      'Null measurements mean unavailable, never zero or PASS. Capture the assigned section before editing if no current measurement exists.',
      'Source viewport width is the frame width, never the content/grid width. Active frames describe states of the canonical page.',
      'Return real file evidence. Save each completed fragment immediately. Never invent source content or claim a measurement not performed.'],
    budget: routing.budget };
  // Keep source metadata lossless on disk, but project only one task into the worker context.
  const {routes:_routes,...promptTask}=task;
  const promptBytes=Buffer.byteLength(require('./prompts').prompt(stage,{...promptTask,type:routing.type},path.dirname(dir),feedback));
  const capsuleLimit=routing.budget.maxPromptBytes-promptBytes-512;
  let serialized = JSON.stringify(capsule, null, 2);
  if (Buffer.byteLength(serialized) > capsuleLimit) {
    capsule.snippets = []; // On-demand bounded excerpt requests remain possible.
    capsule.routeBlueprints = capsule.routeBlueprints.map(route => ({ id: route.id, path: route.path, viewport: route.viewport,
      fullPageReference: route.fullPageReference, sectionOrder: route.sectionOrder,
      sections: route.sections.map(section => ({ id: section.id, expected: section.expected, layoutKind: section.layoutKind,
        snapshot: section.snapshot, reference: section.reference, expectedSourceNodes: section.expectedSourceNodes,
        editableContent: section.editableContent, assets: section.assets, sourceGaps: section.sourceGaps })) }));
    capsule.measurements = comparisons.map(c => ({ route: c.route, path: c.path, sections: c.sections.map(s => ({ id: s.id, expected: s.expected, actual: s.actual, delta: s.delta })) }));
    serialized = JSON.stringify(capsule, null, 2);
  }
  if (Buffer.byteLength(serialized) > capsuleLimit) throw Error(`CAPSULE_TOO_LARGE: split task ${task.id}`);
  write(path.join(dir, 'task-capsule.json'), capsule);
  return capsule;
}
module.exports = { create, sourceFiles, excerpt, selectBlueprints };
