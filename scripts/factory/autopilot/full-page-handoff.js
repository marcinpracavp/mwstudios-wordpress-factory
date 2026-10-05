function unique(values) { return [...new Set(values.filter(Boolean))]; }

// Exhausting the bounded route/state build turns is not visual acceptance.
// Preserve the latest host measurements so the whole-site loop can diagnose
// concrete section repairs instead of either rebuilding the route blindly or
// stopping before the diagnostic phase.
function create(task, key, pageChecks = []) {
  const routes = pageChecks.flatMap(check => check?.routes || []);
  const unresolved = routes.filter(route => route.pagePassed !== true);
  if (!unresolved.length) return null;
  const evidence = unique(unresolved.map(route => route.comparison));
  if (!evidence.length) return null;
  const routeIds = unique(unresolved.map(route => route.id));
  const sections = unique(task.sections || []);
  return {
    deferred: {
      id: `full-page-build:${routeIds.join(',') || task.id}`,
      task: key,
      routes: routeIds,
      sections,
      comparison: evidence.join(', '),
      reason: 'Bounded full-page build turns were exhausted. Fresh host measurements are retained for deterministic whole-site diagnosis and scoped repair; this is not visual acceptance.'
    },
    result: {
      status: 'passed',
      summary: 'Complete route/state composition is checkpointed; unresolved full-page measurements are handed to the bounded diagnosis and repair cycle.',
      issues: routeIds.map(id => `Full-page acceptance still required for route: ${id}`),
      evidence
    }
  };
}

module.exports = { create };
