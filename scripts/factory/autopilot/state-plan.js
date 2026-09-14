// Detect state families before implementation. Identical source pixels prove reusable sections.
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
  return plan.version===1 && plan.inputHash===input(manifest) ? plan : null;
}
async function ensure(manifest, page) {
  const cached=load(manifest); if(cached) return cached;
  const families=[];
  for(const key of [...new Set(manifest.routes.map(familyKey))]) {
    const routes=manifest.routes.filter(r=>familyKey(r)===key);
    if(routes.length<2) continue;
    const base=routes.find(r=>!r.state);
    if(!base) continue; // No invented canonical state.
    const records=[];
    for(const r of routes) {
      const sections=r.sections.map(id=>({id,...(r.sectionGeometry?.[id] || read(inside(SNAPSHOT,manifest.sections.find(s=>s.id===id).snapshot)).desktop)}));
      const crops=await page.evaluate(async ({png,sections})=>{
        const im=new Image();im.src=png;await im.decode();
        return sections.map(s=>{
          const x=Math.floor(s.x),y=Math.floor(s.y),w=Math.ceil(s.width),h=Math.ceil(s.height);
          if(x<0||y<0||w<1||h<1||x+w>im.width||y+h>im.height) return {id:s.id,invalid:true};
          const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);
          return {id:s.id,width:w,height:h,png:c.toDataURL('image/png')};
        });
      },{png:`data:image/png;base64,${fs.readFileSync(inside(SNAPSHOT,r.reference)).toString('base64')}`,sections});
      records.push({id:r.id,sections:crops.map(c=>({id:c.id,width:c.width,height:c.height,sourceCropHash:c.png?hash(c.png):null,invalid:!!c.invalid}))});
    }
    const baseline=records.find(r=>r.id===base.id);
    families.push({key,baseRoute:base.id,routes:records.map(r=>({...r,sections:r.sections.map(s=>({...s,
      sharedWithBase:r.id!==base.id && !!s.sourceCropHash && baseline.sections.some(b=>b.id===s.id&&b.sourceCropHash===s.sourceCropHash)
    }))}))});
  }
  const result={version:1,inputHash:input(manifest),families};write(file,result);return result;
}
function routePlan(plan,id) {
  const family=plan?.families.find(f=>f.routes.some(r=>r.id===id));
  if(!family) return null;
  const route=family.routes.find(r=>r.id===id);
  return {family:family.key,baseRoute:family.baseRoute,route:id,
    reusedSections:route.sections.filter(s=>s.sharedWithBase).map(s=>s.id),
    focusSections:route.sections.filter(s=>!s.sharedWithBase).map(s=>s.id)};
}
module.exports={ensure,load,routePlan};
if(require.main===module) (async()=>{
  const manifest=require('./source-geometry').resolveManifest();
  let plan=load(manifest);
  if(!plan) {
    const {discoverBrowser,getChromium}=require('../qa/browser');
    const browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,headless:true});
    try { plan=await ensure(manifest,await browser.newPage()); } finally { await browser.close(); }
  }
  console.log(JSON.stringify(plan.families.map(f=>({base:f.baseRoute,routes:f.routes.map(r=>({id:r.id,reused:r.sections.filter(s=>s.sharedWithBase).map(s=>s.id)}))}))));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
