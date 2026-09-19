const { sectionOwnership } = require('./visual-ownership');
const { hash } = require('./common');
function plan(manifest, families, registry = []) {
  if (!Array.isArray(registry) || registry.some(c=>!c.id || !Array.isArray(c.sections) || c.sections.some(id=>!manifest.sections.some(s=>s.id===id)))) throw Error('INVALID_COMPONENT_REGISTRY');
  const shared = [], pages = [], seen = new Set();
  for (const route of [...manifest.routes].sort((a, b) => Number(!!a.state) - Number(!!b.state))) {
    const state = require('./state-plan').routePlan(families, route.id);
    for (const id of route.sections) {
      if (state?.reusedSections.includes(id)) continue;
      const reusable=registry.find(c=>c.sections.includes(id));
      const groups=reusable ? new Set(manifest.routes.filter(r=>r.sections.some(s=>reusable.sections.includes(s))).map(r=>r.buildGroup)) : new Set();
      const owner = sectionOwnership(manifest, id,reusable && groups.size>1 ? {component:reusable.id}:null).owner;
      const item = { id: `${route.id}-${id}`, type: 'component-build', sections: [id], routes: [route], component: id, owner,
        ...(reusable?{reuseComponent:reusable.id,files:reusable.files || []}: {}) };
      if (owner !== 'page') {
        // Canonical IDs may have real active variants; those need separate scoped checks.
        const key = JSON.stringify([id, route.width, route.state || null, route.sectionGeometry?.[id]?.width, route.sectionGeometry?.[id]?.height]);
        if (seen.has(key)) continue;
        seen.add(key); shared.push({ ...item, id: `shared-${hash(key).slice(0, 16)}`, shared: true });
      } else pages.push(item);
    }
  }
  return { shared, pages };
}
module.exports = { plan };
