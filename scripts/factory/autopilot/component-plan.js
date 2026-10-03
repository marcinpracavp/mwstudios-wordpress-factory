const { sectionOwnership } = require('./visual-ownership');
const { hash } = require('./common');
function plan(manifest, families, registry = []) {
  if (!Array.isArray(registry) || registry.some(c=>!c.id || !Array.isArray(c.sections) || c.sections.some(id=>!manifest.sections.some(s=>s.id===id)))) throw Error('INVALID_COMPONENT_REGISTRY');
  const shared = [], pages = [], seen = new Set();
  for (const route of [...manifest.routes].sort((a, b) => Number(!!a.state) - Number(!!b.state))) {
    const state = require('./state-plan').routePlan(families, route.id);
    for (const id of route.sections) {
      if (state?.reusedSections.includes(id)) continue;
      // A section can compose several reusable fragments (for example a
      // page banner, a card grid and the route shell). `find()` silently
      // picked the first registry row, leaving the renderer outside the
      // capsule and causing the worker to implement only a decorative child.
      const reusables=registry.filter(c=>c.sections.includes(id));
      const reuseComponents=reusables.map(c=>c.id);
      const componentFiles=[...new Set(reusables.flatMap(c=>c.files || []))];
      // Registry reuse means a file/component may be shared; it does not turn
      // every page section that uses it into a shared visual owner. Header and
      // footer are the only source-identifiable shared chrome by default.
      const owner = sectionOwnership(manifest, id).owner;
      const item = { id: `${route.id}-${id}`, type: 'component-build', sections: [id], routes: [route], component: id, owner,
        ...(reusables.length?{reuseComponents,reuseComponent:reuseComponents.join(', '),files:componentFiles}: {}) };
      if (owner !== 'page') {
        // Canonical IDs may have real active variants; those need separate scoped checks.
        const key = JSON.stringify([id, reuseComponents, componentFiles, route.width, route.state || null, route.sectionGeometry?.[id]?.width, route.sectionGeometry?.[id]?.height]);
        if (seen.has(key)) continue;
        seen.add(key); shared.push({ ...item, id: `shared-${hash(key).slice(0, 16)}`, shared: true });
      } else pages.push(item);
    }
  }
  // Page implementation is route-first. A route worker receives every
  // page-owned section in source order, so it can compose the page and its
  // editable field structure coherently. Section items remain as derivation
  // evidence and are used only by later measured repair diagnostics.
  const routePages=[];
  for (const route of [...manifest.routes].sort((a,b)=>Number(!!a.state)-Number(!!b.state))) {
    const items=pages.filter(item=>item.routes[0]?.id===route.id);
    if(!items.length)continue;
    const sections=route.sections.filter(id=>items.some(item=>item.sections.includes(id)));
    routePages.push({id:`route-${route.id}`,type:'component-build',mode:'route-build',title:`Complete route composition: ${route.id}`,
      buildGroup:route.buildGroup,routes:[route],sections,component:`route:${route.id}`,owner:'page',
      reuseComponents:[...new Set(items.flatMap(item=>item.reuseComponents || []))],
      files:[...new Set(items.flatMap(item=>item.files || []))]});
  }
  return { shared, pages: routePages, sectionRepairs: pages };
}
module.exports = { plan };
