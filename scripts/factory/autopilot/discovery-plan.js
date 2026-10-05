const { hash } = require('./common');

function safeId(value) {
  const readable = String(value || 'route').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'route';
  return `${readable}-${hash(String(value)).slice(0, 8)}`;
}

// Discovery is deliberately frame-first. Every production frame and state is
// inspected as a complete route before any implementation plan is created.
// Sections remain persistence units inside that route audit; they are not
// separate discovery sessions.
function plan(manifest) {
  const indexed = (manifest.routes || []).map((route, index) => ({ route, index }));
  const groups = [...new Set(indexed.map(item => item.route.buildGroup || item.route.id))];
  groups.sort((a, b) => {
    const home = group => indexed.some(item => (item.route.buildGroup || item.route.id) === group && item.route.path === '/' && !item.route.state);
    return Number(home(b)) - Number(home(a));
  });
  const tasks = [];
  for (const group of groups) {
    const routes = indexed
      .filter(item => (item.route.buildGroup || item.route.id) === group)
      .sort((a, b) => Number(!!a.route.state) - Number(!!b.route.state) || a.index - b.index)
      .map(item => item.route);
    for (const route of routes) tasks.push({
      id: `route-audit-${safeId(route.id)}`,
      scope: 'route',
      type: 'source-extraction',
      title: `Complete Figma frame audit: ${route.id}`,
      buildGroup: route.buildGroup || route.id,
      sections: [...route.sections],
      routes: [route],
      frameNodeId: route.frameNodeId,
      state: route.state || null,
    });
  }
  return tasks;
}

module.exports = { plan, safeId };
