// No LLM required to distinguish shared health failures from local geometry defects.
function diagnose(comparisons, threshold = 0.085) {
  const all = comparisons.filter(Boolean), result = [], covered = new Set();
  const errors = new Map();
  for (const c of all) for (const error of new Set(c.errors || [])) {
    if (!/overflow|health|HTTP|Fonts not ready|Broken images|TypeError|ReferenceError/i.test(error)) continue;
    // Retain the actual error/viewport. Different failures must not become one global issue.
    const key = error.replace(/Horizontal overflow [\d.]+px/, 'Horizontal overflow');
    if (!errors.has(key)) errors.set(key, []);
    errors.get(key).push({ route: c.id, error });
  }
  for (const [error, occurrences] of errors) {
    const global = all.length > 1 && new Set(occurrences.map(o => o.route)).size === all.length;
    result.push({ id: `health-${result.length}`, type: /TypeError|ReferenceError/.test(error) ? 'interaction' : 'style-fix',
      owner: global ? 'shared' : 'page', global, sections: [], routes: occurrences.map(o => o.route),
      priority: 0, reason: error, evidence: occurrences, requiresDiagnosis: true });
  }
  for (const c of all) {
    for (const g of c.geometry || []) {
      const ratio = c.pixels?.components?.[g.id]?.ratio ?? c.pixels?.sections?.find?.(s => s.id === g.id)?.ratio;
      if (g.reused || (g.passed && !(ratio > threshold))) continue;
      const shared = ['header', 'footer', 'shared'].includes(g.owner);
      const key = shared ? `${g.id}:${g.expected?.width}:${g.expected?.height}` : `${c.id}:${g.id}`;
      if (covered.has(key)) continue;
      covered.add(key);
      const height = Math.abs(g.delta?.height || 0), width = Math.abs(g.delta?.width || 0);
      result.push({ id: `section-${result.length}`, type: g.actual ? 'style-fix' : 'component-build', owner: g.owner, global: shared,
        sections: [g.id], routes: [c.id], priority: height > 2 || width > 2 ? 1 : 2,
        reason: !g.actual ? 'Missing section' : height > 2 ? 'Section height differs' : 'Section geometry or pixels differ',
        expected: g.expected, actual: g.actual || null, delta: g.delta, ratio: ratio ?? null });
    }
    if (!result.some(t => t.routes.includes(c.id)) && c.passed === false) result.push({ id: `route-${result.length}`, type: 'visual-review', owner: 'page',
      sections: [], routes: [c.id], priority: 3, reason: 'Inspect remaining measured route failures', evidence: c.errors });
  }
  return result.sort((a, b) => Number(b.global) - Number(a.global) || a.priority - b.priority);
}
module.exports = { diagnose };
