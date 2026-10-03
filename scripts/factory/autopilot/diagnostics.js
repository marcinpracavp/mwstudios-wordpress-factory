const { sectionOwnership } = require('./visual-ownership');

// No LLM required to distinguish shared health failures from local geometry defects.
function diagnose(comparisons, threshold = 0.085, manifest = null) {
  const all = comparisons.filter(Boolean), result = [], covered = new Set();
  const unavailable=new Set();
  const sharedSemantic = new Map();
  const ownership = id => manifest ? sectionOwnership(manifest, id) :
    (/(^|-)shared-(header|footer)$/.test(id) ? { owner: 'shared', component: id } : { owner: 'page', component: null });
  for(const c of all){
    const rendered=c.rendered?.height??c.pixels?.renderedSize?.height,reference=c.reference?.height??c.pixels?.referenceSize?.height;
    const pageSections=(c.geometry||[]).filter(g=>g.owner==='page');
    const noContent=pageSections.length>0&&pageSections.every(g=>!g.actual||g.actual.height<=1);
    const viewportOnly=Number.isFinite(rendered)&&Number.isFinite(reference)&&rendered<reference*0.6&&rendered<=(c.viewportHeight||900)+2;
    if(rendered===0||noContent||viewportOnly){
      unavailable.add(c.id);result.push({id:`state-${c.id}`,class:'unavailable-state',type:'state-preparation',onlyModel:'luna',
        owner:'state',global:false,sections:[],routes:[c.id],priority:-1,requiresDiagnosis:true,
        reason:'UNAVAILABLE_STATE: empty or viewport-only render; verify session, route and content before CSS',
        evidence:{renderedHeight:rendered??null,referenceHeight:reference??null,noContent,state:c.state||null}});
    }
  }
  const widths=[...new Set(all.flatMap(c=>(c.responsive||[]).map(r=>r.width)))];
  for(const width of widths){
    const occurrences=all.map(c=>({route:c.id,metric:c.responsive?.find(r=>r.width===width)}));
    if(all.length>1&&occurrences.every(o=>Number.isFinite(o.metric?.overflow)&&o.metric.overflow>1)){
      let task=result.find(t=>t.id==='global-overflow');
      if(!task){task={id:'global-overflow',class:'global-css',type:'style-fix',owner:'shared',component:'header',global:true,sections:[],routes:all.map(c=>c.id),priority:0,reason:'GLOBAL_CSS_OVERFLOW: inspect common layout across affected widths',evidence:[]};result.push(task);}
      task.evidence.push(...occurrences.map(o=>({route:o.route,width,overflow:o.metric.overflow})));
    }
  }
  const errors = new Map();
  for (const c of all.filter(c=>!unavailable.has(c.id))) for (const error of new Set(c.errors || [])) {
    if (!/overflow|health|HTTP|Fonts not ready|Broken images|TypeError|ReferenceError/i.test(error)) continue;
    // Retain the actual error/viewport. Different failures must not become one global issue.
    const key = error.replace(/Horizontal overflow [\d.]+px/, 'Horizontal overflow');
    if (!errors.has(key)) errors.set(key, []);
    errors.get(key).push({ route: c.id, error });
  }
  for (const [error, occurrences] of errors) {
    const global = all.length > 1 && new Set(occurrences.map(o => o.route)).size === all.length;
    if(global && /overflow|Responsive render health/i.test(error) && result.some(t=>t.id==='global-overflow')){
      result.find(t=>t.id==='global-overflow').evidence.push(...occurrences);continue;
    }
    const type=/TypeError|ReferenceError/.test(error)?'interaction':/HTTP|Broken images|health/i.test(error)?'refactor':'style-fix';
    result.push({ id: `health-${result.length}`, class:global&&/overflow/i.test(error)?'global-css':type==='style-fix'?'css-fix':type,component:global?'header':null,type,
      owner: global ? 'shared' : 'page', global, sections: [], routes: occurrences.map(o => o.route),
      priority: 0, reason: error, evidence: occurrences, requiresDiagnosis: true });
  }
  // Semantic completeness precedes pixel polish. A perfect crop of one child
  // must not hide source-backed text/media rendered outside its owning
  // section, nor a visible top-level wrapper omitted from the route plan.
  for (const c of all.filter(c=>!unavailable.has(c.id))) {
    for (const section of c.semantic?.sections || []) {
      if (section.passed) continue;
      covered.add(`${c.id}:${section.id}`);
      const owner = ownership(section.id);
      if (owner.owner !== 'page') {
        const existing = sharedSemantic.get(section.id) || {
          id: `semantic-shared-${section.id}`, class: 'php-fix', type: 'template-fix', owner: 'shared', global: true,
          component: owner.component || section.id, sections: [section.id], routes: [], priority: -2,
          reason: `SEMANTIC_SECTION_INCOMPLETE: ${section.id} does not own all source-backed content/media`, evidence: []
        };
        existing.routes.push(c.id);
        existing.evidence.push({ route: c.id, missingSourceNodes: section.missingSourceNodes, outsideSection: section.outsideSection });
        sharedSemantic.set(section.id, existing);
        continue;
      }
      result.push({ id:`semantic-${c.id}-${section.id}`,class:'php-fix',type:'template-fix',owner:'page',global:false,
        sections:[section.id],routes:[c.id],priority:-2,reason:`SEMANTIC_SECTION_INCOMPLETE: ${section.id} does not own all source-backed content/media`,
        evidence:{missingSourceNodes:section.missingSourceNodes,outsideSection:section.outsideSection} });
    }
    for (const orphan of c.semantic?.unregisteredSections || []) {
      const owner=(c.geometry || []).map(item=>item.id).filter(id=>orphan.id.startsWith(`${id}-`)).sort((a,b)=>b.length-a.length)[0] || null;
      const id=owner || orphan.id;
      covered.add(`${c.id}:${id}`);
      result.push({id:`semantic-orphan-${c.id}-${orphan.id}`,class:'php-fix',type:'template-fix',owner:'page',global:false,
        sections:owner?[owner]:[],routes:[c.id],priority:-2,reason:`UNREGISTERED_SECTION: ${orphan.id} is visible but absent from the route blueprint${owner?`; merge it into ${owner}`:''}`,
        evidence:orphan});
    }
  }
  result.push(...sharedSemantic.values());
  for (const c of all) {
    if(unavailable.has(c.id))continue;
    for (const g of c.geometry || []) {
      const ratio = c.pixels?.components?.[g.component||g.id]?.layoutRatio ?? c.pixels?.components?.[g.component||g.id]?.ratio ?? c.pixels?.crops?.find(s => s.id === g.id)?.ratio;
      if (g.reused || (g.passed && !(ratio > threshold))) continue;
      const shared = ['header', 'footer', 'shared'].includes(g.owner);
      const key = shared ? `${g.id}:${g.expected?.width}:${g.expected?.height}` : `${c.id}:${g.id}`;
      if (covered.has(key) || covered.has(`${c.id}:${g.id}`)) continue;
      covered.add(key);
      const height = Math.abs(g.delta?.height || 0), width = Math.abs(g.delta?.width || 0);
      const localHeight=height>50&&!shared&&!(c.errors||[]).some(e=>/overflow/i.test(e))&&!c.responsive?.some(r=>r.overflow>1);
      result.push({ id: `section-${result.length}`, class:localHeight?'local-section':g.actual?'css-fix':'component-build',type: g.actual ? 'style-fix' : 'component-build', owner: g.owner, global: shared,
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
