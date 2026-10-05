const { sectionOwnership } = require('./visual-ownership');
const { hash } = require('./common');

function plan(manifest, families, registry = [], blueprint = null) {
  if (!Array.isArray(registry) || registry.some(component=>!component.id || !Array.isArray(component.sections) || component.sections.some(id=>!manifest.sections.some(section=>section.id===id)))) throw Error('INVALID_COMPONENT_REGISTRY');
  const statePlans=(manifest.routes || []).map(route=>require('./state-plan').routePlan(families,route.id)).filter(Boolean);
  const stateByRoute=new Map(statePlans.map(state=>[state.route,state]));
  const routeById=new Map(manifest.routes.map(route=>[route.id,route]));
  const autoPatterns=(blueprint?.reusablePatterns || []).filter(pattern=>pattern.autoShared);
  const autoByOccurrence=new Map(autoPatterns.flatMap(pattern=>pattern.uses.map(use=>[`${use.route}:${use.section}`,pattern])));
  const shared=[],sectionRepairs=[],seen=new Set();

  for(const pattern of autoPatterns) {
    const canonical=pattern.canonical;
    const route=routeById.get(canonical.route);
    if(!route)continue;
    const owner=sectionOwnership(manifest,canonical.section).owner;
    if(owner!=='page')continue;
    const componentId=`pattern-${pattern.id}`;
    shared.push({id:`shared-${pattern.id}`,type:'component-build',mode:'shared-pattern',shared:true,owner:'shared',component:componentId,
      title:`Reusable structural component: ${componentId}`,sections:[canonical.section],routes:[route],
      variants:pattern.uses,structuralEvidence:pattern.evidence,patternSignature:pattern.id});
  }

  for(const route of [...manifest.routes].sort((a,b)=>Number(!!a.state)-Number(!!b.state))) {
    const state=stateByRoute.get(route.id);
    for(const id of route.sections) {
      if(state?.reusedSections.includes(id))continue;
      const reusables=registry.filter(component=>component.sections.includes(id));
      const reuseComponents=reusables.map(component=>component.id);
      const componentFiles=[...new Set(reusables.flatMap(component=>component.files || []))];
      const owner=sectionOwnership(manifest,id).owner;
      const automatic=autoByOccurrence.get(`${route.id}:${id}`);
      const item={id:`${route.id}-${id}`,type:'component-build',sections:[id],routes:[route],component:id,owner,
        ...(automatic?{reuseComponents:[`pattern-${automatic.id}`],reuseComponent:`pattern-${automatic.id}`,patternSignature:automatic.id}:{}),
        ...(reusables.length?{reuseComponents:[...new Set([...(automatic?[`pattern-${automatic.id}`]:[]),...reuseComponents])],files:componentFiles}: {})};
      if(owner!=='page') {
        const key=JSON.stringify([id,reuseComponents,componentFiles,route.width,route.state || null,route.sectionGeometry?.[id]?.width,route.sectionGeometry?.[id]?.height]);
        if(seen.has(key))continue;
        seen.add(key);shared.push({...item,id:`shared-${hash(key).slice(0,16)}`,shared:true});
      } else if(!automatic) sectionRepairs.push(item);
    }
  }

  const routeTask=route=>{
    const state=stateByRoute.get(route.id);
    const isState=!!route.state&&state?.baseRoute&&state.baseRoute!==route.id;
    const focus=isState ? state.focusSections : route.sections.filter(id=>sectionOwnership(manifest,id).owner==='page'&&!autoByOccurrence.has(`${route.id}:${id}`));
    const patterns=[...new Set(route.sections.map(id=>autoByOccurrence.get(`${route.id}:${id}`)).filter(Boolean).map(pattern=>`pattern-${pattern.id}`))];
    const registered=registry.filter(component=>component.sections.some(id=>route.sections.includes(id)));
    return {id:`route-${route.id}`,type:'component-build',mode:isState?'state-build':'route-build',
      title:isState?`State delta ${route.state}: ${route.id}`:`Complete route composition: ${route.id}`,
      buildGroup:route.buildGroup,routes:[route],sections:focus,component:`route:${route.id}`,owner:'page',
      baseRoute:isState?state.baseRoute:null,stateDelta:isState?state:null,
      reuseComponents:[...new Set([...patterns,...registered.map(component=>component.id)])],
      files:[...new Set(registered.flatMap(component=>component.files || []))]};
  };
  const pages=manifest.routes.filter(route=>!route.state||stateByRoute.get(route.id)?.baseRoute===route.id).map(routeTask);
  const states=manifest.routes.filter(route=>route.state&&stateByRoute.get(route.id)?.baseRoute!==route.id).map(routeTask);
  return {version:2,shared,pages,states,sectionRepairs};
}
module.exports = { plan };
