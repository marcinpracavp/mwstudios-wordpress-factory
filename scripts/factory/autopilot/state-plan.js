// Detect state families before implementation. A state route is a delta over
// its canonical page, never permission to rebuild the complete page.
const fs = require('fs');
const path = require('path');
const { CACHE, SNAPSHOT, inside, read, write, hash } = require('./common');
const file = path.join(CACHE,'state-plan.json');
function familyKey(r) { return JSON.stringify([r.buildGroup,r.path,r.language,r.width]); }
function input(manifest) {
  return hash(JSON.stringify(manifest.routes.map(r=>({id:r.id,family:familyKey(r),state:r.state,
    reference:hash(fs.readFileSync(inside(SNAPSHOT,r.reference))),sections:r.sections.map(id=>{
      const s=manifest.sections.find(s=>s.id===id);
      return {id,box:r.sectionGeometry?.[id] || read(inside(SNAPSHOT,s.snapshot)).desktop};
    })}))));
}
function load(manifest) {
  if (!fs.existsSync(file)) return null;
  const plan=read(file);
  return plan.version===2 && plan.inputHash===input(manifest) ? plan : null;
}
function overlayLike(section) {
  return /popup|modal|dialog|drawer|overlay|lightbox|popover/i.test(`${section.id} ${section.name || ''} ${section.layoutKind || ''}`);
}
function matchBaseSection(section, baseline, claimed) {
  const candidates=baseline.sections.filter(item=>!claimed.has(item.id));
  return candidates.find(item=>item.id===section.id)
    || candidates.find(item=>section.sourceCropHash&&item.sourceCropHash===section.sourceCropHash)
    || candidates.find(item=>section.structureSignature&&item.structureSignature===section.structureSignature&&item.width===section.width&&item.height===section.height)
    || null;
}
function classifyFamily(family) {
  const baseline=family.routes.find(route=>route.id===family.baseRoute);
  if(!baseline)return family;
  return {...family,routes:family.routes.map(route=>{
    if(route.id===baseline.id)return {...route,mode:'base',sections:route.sections.map(section=>({...section,baseSectionId:section.id,sharedWithBase:false,change:'base'})),removedSections:[],overlayOnly:false};
    const claimed=new Set();
    let sections=route.sections.map(section=>{
      const match=matchBaseSection(section,baseline,claimed);
      if(match)claimed.add(match.id);
      const unchanged=!!match&&!!section.sourceCropHash&&section.sourceCropHash===match.sourceCropHash;
      return {...section,baseSectionId:match?.id || null,sharedWithBase:unchanged,change:!match?'added':unchanged?'reused':'changed'};
    });
    const removedSections=baseline.sections.filter(section=>!claimed.has(section.id)).map(section=>section.id);
    const added=sections.filter(section=>section.change==='added');
    const overlayAddition=added.length>0&&added.every(overlayLike);
    if(overlayAddition&&removedSections.length===0)sections=sections.map(section=>{
      const base=baseline.sections.find(candidate=>candidate.id===section.baseSectionId);
      const sameOwnedSection=base&&section.id===base.id&&section.structureSignature&&section.structureSignature===base.structureSignature
        && section.width===base.width&&section.height===base.height;
      return section.change==='changed'&&sameOwnedSection
        ? {...section,change:'reused',sharedWithBase:true,occludedByOverlay:true}
        : section;
    });
    const delta=sections.filter(section=>section.change!=='reused');
    return {...route,mode:'state-delta',sections,removedSections,
      overlayOnly:removedSections.length===0&&delta.length>0&&delta.every(overlayLike)};
  })};
}
async function ensure(manifest, page) {
  const cached=load(manifest); if(cached) return cached;
  const families=[];
  for(const key of [...new Set(manifest.routes.map(familyKey))]) {
    const routes=manifest.routes.filter(r=>familyKey(r)===key);
    if(routes.length<2) continue;
    const base=routes.find(r=>!r.state);
    if(!base) continue;
    const records=[];
    for(const r of routes) {
      const sections=r.sections.map(id=>({
        id,
        ...(r.sectionGeometry?.[id] || read(inside(SNAPSHOT,manifest.sections.find(s=>s.id===id).snapshot)).desktop),
      }));
      const crops=await page.evaluate(async ({png,sections})=>{
        const im=new Image();im.src=png;await im.decode();
        return sections.map(s=>{
          const x=Math.floor(s.x),y=Math.floor(s.y),w=Math.ceil(s.width),h=Math.ceil(s.height);
          if(x<0||y<0||w<1||h<1||x+w>im.width||y+h>im.height) return {id:s.id,invalid:true};
          const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);
          return {id:s.id,width:w,height:h,png:c.toDataURL('image/png')};
        });
      },{png:`data:image/png;base64,${fs.readFileSync(inside(SNAPSHOT,r.reference)).toString('base64')}`,sections});
      records.push({id:r.id,state:r.state || null,sections:crops.map(c=>{
        const entry=manifest.sections.find(section=>section.id===c.id);
        const snapshot=entry?.snapshot ? read(inside(SNAPSHOT,entry.snapshot)) : {};
        const structure=require('./structure-analysis').sectionStructure({id:c.id,snapshotData:snapshot});
        return {id:c.id,name:entry?.name || c.id,width:c.width,height:c.height,sourceCropHash:c.png?hash(c.png):null,
          structureSignature:structure.signature,layoutKind:snapshot.layout?.type || null,invalid:!!c.invalid};
      })});
    }
    families.push(classifyFamily({key,baseRoute:base.id,routes:records}));
  }
  const result={version:2,inputHash:input(manifest),families};write(file,result);return result;
}
function routePlan(plan,id) {
  const family=plan?.families.find(f=>f.routes.some(r=>r.id===id));
  if(!family) return null;
  const route=family.routes.find(r=>r.id===id);
  return {family:family.key,baseRoute:family.baseRoute,route:id,
    reusedSections:route.sections.filter(s=>s.sharedWithBase).map(s=>s.id),
    focusSections:route.sections.filter(s=>!s.sharedWithBase).map(s=>s.id),
    addedSections:route.sections.filter(s=>s.change==='added').map(s=>s.id),
    changedSections:route.sections.filter(s=>s.change==='changed').map(s=>s.id),
    removedSections:route.removedSections || [],overlayOnly:!!route.overlayOnly,
    mode:route.mode || (route.id===family.baseRoute?'base':'state-delta'),
    sectionMap:Object.fromEntries(route.sections.filter(s=>s.baseSectionId).map(s=>[s.id,s.baseSectionId]))};
}
module.exports={ensure,load,routePlan,classifyFamily,overlayLike};
if(require.main===module) (async()=>{
  const manifest=require('./source-geometry').resolveManifest();
  let plan=load(manifest);
  if(!plan) {
    const {discoverBrowser,getChromium}=require('../qa/browser');
    const browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,headless:true});
    try { plan=await ensure(manifest,await browser.newPage()); } finally { await browser.close(); }
  }
  console.log(JSON.stringify(plan.families.map(f=>({base:f.baseRoute,routes:f.routes.map(r=>({id:r.id,mode:r.mode,overlayOnly:r.overlayOnly,reused:r.sections.filter(s=>s.sharedWithBase).map(s=>s.id)}))}))));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
